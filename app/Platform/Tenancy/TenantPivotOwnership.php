<?php

namespace App\Platform\Tenancy;

use Illuminate\Database\Eloquent\Model;
use LogicException;
use Throwable;

final class TenantPivotOwnership
{
    public function __construct(private readonly TenantSchemaManager $schema)
    {
    }

    public function bind(Model $model): void
    {
        if (!method_exists($model, 'bindEvent') || !method_exists($model, 'handleRelation')) return;

        $model->bindEvent('model.relation.beforeAttach', function(
            string $relationName,
            array &$ids,
            array &$attributes,
        ) use ($model): void {
            try {
                $relation = $model->handleRelation($relationName);
            } catch (Throwable) {
                return;
            }

            if (!method_exists($relation, 'getTable')
                || !in_array($relation->getTable(), $this->schema->ownershipTables(), true)) return;

            $related = $relation->getRelated();
            $relatedIds = array_values(array_filter($ids, fn($id) => is_int($id) || ctype_digit((string)$id)));
            $relatedIsTenantOwned = in_array($related->getTable(), $this->schema->ownershipTables(), true);

            $tenantId = (int)$model->getAttribute('restaurant_id');
            if (!$tenantId && app(TenantContext::class)->has()) {
                $tenantId = app(TenantContext::class)->id();
            }
            if (!$tenantId && $relatedIsTenantOwned && $relatedIds) {
                $relatedTenantIds = $related->newQueryWithoutScopes()->whereIn($related->getKeyName(), $relatedIds)
                    ->distinct()->pluck('restaurant_id')->filter()->map(fn($id) => (int)$id)->unique()->values();
                if ($relatedTenantIds->count() === 1) {
                    $tenantId = (int)$relatedTenantIds->first();
                } elseif ($relatedTenantIds->count() > 1) {
                    throw new LogicException("Tenant-owned relation {$relationName} cannot attach records from multiple restaurants.");
                }
            }
            if (!$tenantId) {
                throw new LogicException("Tenant-owned relation {$relationName} requires restaurant context before attach.");
            }

            if ($relatedIds && $relatedIsTenantOwned
                && $related->newQueryWithoutScopes()->whereIn($related->getKeyName(), $relatedIds)
                    ->where('restaurant_id', '!=', $tenantId)->exists()) {
                throw new LogicException("Tenant-owned relation {$relationName} cannot attach a record from another restaurant.");
            }

            $attributes['restaurant_id'] = $tenantId;
        }, 100);
    }
}
