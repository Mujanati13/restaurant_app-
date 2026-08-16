<?php

namespace App\Http\Controllers\Platform;

use App\Platform\Branding\BrandConfiguration;
use App\Platform\Models\PlatformAdmin;
use App\Platform\Models\PlatformAlert;
use App\Platform\Models\PlatformAuditLog;
use App\Platform\Models\PlatformTemplate;
use App\Platform\Monitoring\PlatformHealth;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class PlatformOperationsController extends Controller
{
    public function templates(Request $request): JsonResponse
    {
        $this->admin($request);
        return response()->json(['data' => PlatformTemplate::query()->orderByDesc('is_default')->orderBy('name')->get()->map(fn($item) => $this->templateData($item))->values()]);
    }

    public function storeTemplate(Request $request): JsonResponse
    {
        $admin = $this->admin($request);
        $data = $request->validate(['code' => ['required', 'alpha_dash', 'max:80', Rule::unique('platform_templates')],
            'name' => ['required', 'string', 'max:120'], 'description' => ['nullable', 'string', 'max:1000'],
            'configuration' => ['required', 'array'], 'active' => ['required', 'boolean'], 'is_default' => ['required', 'boolean']]);
        Validator::make($data['configuration'], BrandConfiguration::rules())->validate();
        $this->assertDefaultInvariant($data);
        $template = DB::transaction(function () use ($data) {
            if ($data['is_default']) PlatformTemplate::query()->update(['is_default' => false]);
            return PlatformTemplate::query()->create($data);
        });
        $this->audit($request, $admin, 'platform_template.created', $template->getKey(), ['code' => $template->code]);
        return response()->json(['data' => $this->templateData($template)], 201);
    }

    public function updateTemplate(Request $request, string $publicId): JsonResponse
    {
        $admin = $this->admin($request);
        $template = PlatformTemplate::query()->where('public_id', $publicId)->firstOrFail();
        $data = $request->validate(['name' => ['required', 'string', 'max:120'], 'description' => ['nullable', 'string', 'max:1000'],
            'configuration' => ['required', 'array'], 'active' => ['required', 'boolean'], 'is_default' => ['required', 'boolean']]);
        Validator::make($data['configuration'], BrandConfiguration::rules())->validate();
        $this->assertDefaultInvariant($data, $template);
        DB::transaction(function () use ($data, $template): void {
            if ($data['is_default']) PlatformTemplate::query()->where($template->getKeyName(), '!=', $template->getKey())->update(['is_default' => false]);
            $template->update([...$data, 'version' => $template->version + 1]);
        });
        $this->audit($request, $admin, 'platform_template.updated', $template->getKey(), ['code' => $template->code, 'version' => $template->version]);
        return response()->json(['data' => $this->templateData($template)]);
    }

    public function alerts(Request $request): JsonResponse
    {
        $this->admin($request);
        $data = $request->validate(['status' => ['nullable', Rule::in(['open', 'acknowledged', 'resolved'])],
            'severity' => ['nullable', Rule::in(['info', 'warning', 'critical'])], 'page' => ['nullable', 'integer', 'min:1'], 'limit' => ['nullable', 'integer', 'min:1', 'max:100']]);
        $items = PlatformAlert::query()->with('restaurant')->when($data['status'] ?? null, fn($q, $v) => $q->where('status', $v))
            ->when($data['severity'] ?? null, fn($q, $v) => $q->where('severity', $v))->orderByRaw("FIELD(severity, 'critical', 'warning', 'info')")
            ->latest('last_seen_at')->paginate($data['limit'] ?? 30, ['*'], 'page', $data['page'] ?? 1);
        return response()->json(['data' => $items->getCollection()->map(fn($item) => $this->alertData($item))->values(),
            'meta' => ['page' => $items->currentPage(), 'limit' => $items->perPage(), 'total' => $items->total(), 'last_page' => $items->lastPage()]]);
    }

    public function acknowledgeAlert(Request $request, int $alertId): JsonResponse
    {
        $admin = $this->admin($request);
        $data = $request->validate(['reason' => ['required', 'string', 'max:500']]);
        $alert = PlatformAlert::query()->findOrFail($alertId);
        abort_if($alert->status === 'resolved', 409, 'Resolved alerts cannot be acknowledged.');
        $alert->update(['status' => 'acknowledged', 'acknowledged_at' => now(), 'acknowledged_by' => $admin->getKey()]);
        $this->audit($request, $admin, 'platform_alert.acknowledged', $alert->getKey(), ['reason' => $data['reason']]);
        return response()->json(['data' => $this->alertData($alert)]);
    }

    public function health(Request $request, PlatformHealth $health): JsonResponse
    {
        $this->admin($request);
        return response()->json(['data' => $health->snapshot()]);
    }

    private function admin(Request $request): PlatformAdmin
    {
        $admin = $request->user();
        abort_unless($admin instanceof PlatformAdmin && $admin->active, 403);
        return $admin;
    }

    private function assertDefaultInvariant(array $data, ?PlatformTemplate $current = null): void
    {
        if ($data['is_default'] && !$data['active']) {
            throw ValidationException::withMessages(['active' => ['The default template must remain active.']]);
        }
        if ($data['is_default']) return;
        $hasAnotherDefault = PlatformTemplate::query()->where('is_default', true)->where('active', true)
            ->when($current, fn($query) => $query->where($current->getKeyName(), '!=', $current->getKey()))->exists();
        if (!$hasAnotherDefault) {
            throw ValidationException::withMessages(['is_default' => ['At least one active default template is required.']]);
        }
    }

    private function templateData(PlatformTemplate $item): array { return ['id' => $item->public_id, 'code' => $item->code, 'name' => $item->name,
        'description' => $item->description, 'configuration' => $item->configuration, 'active' => $item->active, 'is_default' => $item->is_default, 'version' => $item->version]; }
    private function alertData(PlatformAlert $item): array { return ['id' => $item->getKey(), 'restaurant' => $item->restaurant ? ['id' => $item->restaurant->public_id, 'name' => $item->restaurant->name] : null,
        'type' => $item->type, 'severity' => $item->severity, 'status' => $item->status, 'message' => $item->message, 'context' => $item->context,
        'first_seen_at' => $item->first_seen_at?->toIso8601String(), 'last_seen_at' => $item->last_seen_at?->toIso8601String()]; }
    private function audit(Request $request, PlatformAdmin $admin, string $action, int $subjectId, array $metadata): void { PlatformAuditLog::query()->create([
        'actor_type' => 'super_admin', 'actor_id' => $admin->getKey(), 'action' => $action, 'subject_type' => 'platform_operation',
        'subject_id' => (string) $subjectId, 'metadata' => $metadata, 'ip_address' => $request->ip()]); }
}
