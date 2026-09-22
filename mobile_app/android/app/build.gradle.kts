import java.util.Properties

plugins {
    id("com.android.application")
    id("kotlin-android")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

val keystorePropertiesFile = rootProject.file("key.properties")
val keystoreProperties = Properties()
val signingPropertyNames = listOf("storeFile", "storePassword", "keyAlias", "keyPassword")

if (keystorePropertiesFile.exists()) {
    keystorePropertiesFile.inputStream().use { keystoreProperties.load(it) }
}

val releaseBuildRequested = gradle.startParameter.taskNames.any {
    it.contains("release", ignoreCase = true)
}

if (releaseBuildRequested) {
    check(keystorePropertiesFile.exists()) {
        "Missing android/key.properties. Copy key.properties.example and enter the release keystore details."
    }
    val missingSigningProperties = signingPropertyNames.filter { keystoreProperties.getProperty(it).isNullOrBlank() }
    check(missingSigningProperties.isEmpty()) {
        "Missing release signing values in android/key.properties: ${missingSigningProperties.joinToString(", ")}"
    }
}

android {
    namespace = "com.vondo.vendor"
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
        applicationId = "com.vondo.vendor"
        // You can update the following values to match your application needs.
        // For more information, see: https://flutter.dev/to/review-gradle-config.
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    signingConfigs {
        if (keystorePropertiesFile.exists()) {
            create("release") {
                keyAlias = keystoreProperties.getProperty("keyAlias")
                keyPassword = keystoreProperties.getProperty("keyPassword")
                storeFile = file(keystoreProperties.getProperty("storeFile"))
                storePassword = keystoreProperties.getProperty("storePassword")
            }
        }
    }

    flavorDimensions += "tenant"
    productFlavors {
        create("universal") {
            dimension = "tenant"
            applicationId = "com.vondo.vendor"
            resValue("string", "app_name", "Vondo Vendor")
            manifestPlaceholders["vondoUrlScheme"] = "vondo-vendor"
            manifestPlaceholders["vondoAppHost"] = "localhost"
        }
        create("whiteLabel") {
            dimension = "tenant"
            applicationId = providers.gradleProperty("vondoApplicationId").orElse("com.vondo.vendor.whitelabel").get()
            resValue("string", "app_name", providers.gradleProperty("vondoAppName").orElse("Restaurant Vendor").get())
            manifestPlaceholders["vondoUrlScheme"] = providers.gradleProperty("vondoUrlScheme").orElse("vondo-restaurant-vendor").get()
            manifestPlaceholders["vondoAppHost"] = providers.gradleProperty("vondoAppHost").orElse("restaurant.example.com").get()
        }
    }

    buildTypes {
        release {
            if (keystorePropertiesFile.exists()) {
                signingConfig = signingConfigs.getByName("release")
            }
        }
    }
}

flutter {
    source = "../.."
}
