import org.jetbrains.kotlin.gradle.dsl.JvmTarget
import java.util.*

val keyProperties = Properties()
keyProperties.load(file("../key.properties").inputStream())

plugins {
    id("com.android.application")
    // START: FlutterFire Configuration
    id("com.google.gms.google-services")
    // END: FlutterFire Configuration
    id("kotlin-android")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

kotlin {
    compilerOptions {
        jvmTarget.set(JvmTarget.JVM_17)
    }
}

android {
    namespace = "com.kibabiinest.nest"
    compileSdk = 36
    ndkVersion = flutter.ndkVersion

    compileOptions {
        isCoreLibraryDesugaringEnabled = true
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    defaultConfig {
        // TODO: Specify your own unique Application ID (https://developer.android.com/studio/build/application-id.html).
        applicationId = "com.kibabiinest.nest"
        // You can update the following values to match your application needs.
        // For more information, see: https://flutter.dev/to/review-gradle-config.
        minSdk = 24
        targetSdk = 35
        versionCode = flutter.versionCode
        versionName = flutter.versionName
        multiDexEnabled = true
    }

    signingConfigs {
        create("release") {
            val rawStorePath = keyProperties["storeFile"] as String
            // Normalize common prefix where key.properties uses "app/filename.jks"
            val storePath = if (rawStorePath.startsWith("app/")) rawStorePath.removePrefix("app/") else rawStorePath
            val candidate = file(storePath)
            val resolved = if (candidate.isAbsolute) {
                candidate
            } else {
                // Try module-relative first (this is android/app), then rootDir
                if (candidate.exists()) candidate else {
                    val byRoot = file("${rootDir}/$storePath")
                    if (byRoot.exists()) byRoot else file("${project.projectDir}/$storePath")
                }
            }
            storeFile = resolved
            storePassword = keyProperties["storePassword"] as String
            keyAlias = keyProperties["keyAlias"] as String
            keyPassword = keyProperties["keyPassword"] as String
        }
    }

    buildTypes {
        release {
            signingConfig = signingConfigs.getByName("release")
        }
    }
}

flutter {
    source = "../.."
}

dependencies {
    coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.1.4")
    implementation("androidx.appcompat:appcompat:1.6.1")
}
