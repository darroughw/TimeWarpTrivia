// Root build file — just declares plugin versions once so app/build.gradle.kts
// can apply them without repeating a version. See android-tv/README.md: open
// this whole android-tv/ directory as its own project in Android Studio, which
// will offer to upgrade these to whatever AGP/Kotlin it currently bundles —
// accept that instead of fighting it.
plugins {
    id("com.android.application") version "8.5.0" apply false
    id("org.jetbrains.kotlin.android") version "1.9.24" apply false
}
