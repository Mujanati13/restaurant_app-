plugins {
    id("com.android.application")
    id("kotlin-android")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

android {
    namespace = "com.vondo.customer_app"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = JavaVersion.VERSION_17.toString()
    }

    defaultConfig {
        // TODO: Specify your own unique Application ID (https://developer.android.com/studio/build/application-id.html).
        applicationId = "com.vondo.customer_app"
        // You can update the following values to match your application needs.
        // For more information, see: https://flutter.dev/to/review-gradle-config.
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    flavorDimensions += "tenant"
    productFlavors {
        create("universal") {
            dimension = "tenant"
            applicationId = "com.vondo.customer"
            resValue("string", "app_name", "Vondo")
            manifestPlaceholders["vondoUrlScheme"] = "vondo"
            manifestPlaceholders["vondoAppHost"] = "localhost"
        }
        create("whiteLabel") {
            dimension = "tenant"
            applicationId = providers.gradleProperty("vondoApplicationId").orElse("com.vondo.customer.whitelabel").get()
            resValue("string", "app_name", providers.gradleProperty("vondoAppName").orElse("My Restaurant").get())
            manifestPlaceholders["vondoUrlScheme"] = providers.gradleProperty("vondoUrlScheme").orElse("vondo-restaurant").get()
            manifestPlaceholders["vondoAppHost"] = providers.gradleProperty("vondoAppHost").orElse("restaurant.example.com").get()
        }
    }

    buildTypes {
        release {
            // The secured external white-label compiler injects release signing.
            // Local release artifacts intentionally remain unsigned.
        }
    }
}

flutter {
    source = "../.."
}
