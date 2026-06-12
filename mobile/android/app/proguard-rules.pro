# Mapbox
-keep class com.mapbox.maps.** { *; }
-keep class com.mapbox.** { *; }
-dontwarn com.mapbox.**

# Keep Mapbox plugin classes
-keep class com.mapbox.maps.plugin.** { *; }
-keep interface com.mapbox.maps.plugin.** { *; }

# Flutter
-keep class io.flutter.** { *; }
-dontwarn io.flutter.**
