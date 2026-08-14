plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.timewarptrivia.tv"
    // Targets Android TV specifically (see AndroidManifest.xml's leanback
    // <uses-feature>), not phones/tablets — compileSdk/targetSdk track
    // whatever's current when this is opened in Android Studio; bump both
    // together if Studio's upgrade assistant suggests it.
    compileSdk = 34

    defaultConfig {
        applicationId = "com.timewarptrivia.tv"
        // Android TV (Leanback) has shipped since API 21 (Lollipop) —
        // there's no real device population below that to support.
        minSdk = 21
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("androidx.activity:activity-ktx:1.9.0")
    // WebViewFeature/WebSettingsCompat — lets MainActivity check
    // feature-availability before touching newer WebView APIs, since the
    // installed WebView version varies by device/OEM on Android TV far
    // more than it does on phones.
    implementation("androidx.webkit:webkit:1.11.0")
}
