package com.example.allinone.ui.theme

import android.app.Activity
import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val LightColorScheme = lightColorScheme(
    primary = Color.Black,
    onPrimary = Color.White,
    primaryContainer = Color.White,
    onPrimaryContainer = Color.Black,
    secondary = Color.Black,
    onSecondary = Color.White,
    secondaryContainer = Color.White,
    onSecondaryContainer = Color.Black,
    tertiary = Color.Black,
    onTertiary = Color.White,
    tertiaryContainer = Color.White,
    onTertiaryContainer = Color.Black,
    error = ExpenseRed,
    onError = Color.White,
    errorContainer = Color.White,
    onErrorContainer = ExpenseRed,
    background = Color.White,
    onBackground = Color.Black,
    surface = Color.White,
    onSurface = Color.Black,
    surfaceVariant = Color.White,
    onSurfaceVariant = Color.Black.copy(alpha = 0.6f),
    surfaceContainer = Color.White,
    surfaceContainerHigh = Color.White,
    surfaceContainerHighest = Color.White,
    surfaceContainerLow = Color.White,
    surfaceContainerLowest = Color.White,
    surfaceDim = Color.White,
    surfaceBright = Color.White,
    inverseSurface = Color.Black,
    inverseOnSurface = Color.White,
    inversePrimary = Color.White,
    scrim = Color.Black,
    outline = Color.Black.copy(alpha = 0.2f),
    outlineVariant = Color.Black.copy(alpha = 0.1f),
    surfaceTint = Color.Transparent
)

private val DarkColorScheme = darkColorScheme(
    primary = Color.White,
    onPrimary = Color.Black,
    primaryContainer = Color.Black,
    onPrimaryContainer = Color.White,
    secondary = Color.White,
    onSecondary = Color.Black,
    secondaryContainer = Color.Black,
    onSecondaryContainer = Color.White,
    tertiary = Color.White,
    onTertiary = Color.Black,
    tertiaryContainer = Color.Black,
    onTertiaryContainer = Color.White,
    error = ExpenseRed,
    onError = Color.White,
    errorContainer = Color.Black,
    onErrorContainer = ExpenseRed,
    background = Color.Black,
    onBackground = Color.White,
    surface = Color.Black,
    onSurface = Color.White,
    surfaceVariant = Color.Black,
    onSurfaceVariant = Color.White.copy(alpha = 0.6f),
    surfaceContainer = Color.Black,
    surfaceContainerHigh = Color.Black,
    surfaceContainerHighest = Color.Black,
    surfaceContainerLow = Color.Black,
    surfaceContainerLowest = Color.Black,
    surfaceDim = Color.Black,
    surfaceBright = Color.Black,
    inverseSurface = Color.White,
    inverseOnSurface = Color.Black,
    inversePrimary = Color.Black,
    scrim = Color.White,
    outline = Color.White.copy(alpha = 0.2f),
    outlineVariant = Color.White.copy(alpha = 0.1f),
    surfaceTint = Color.Transparent
)

@Composable
fun AllInOneTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    // Force our custom color schemes, dynamic colors completely disabled
    // Override any system theming by creating completely custom scheme
    // Updated: Ensuring all surfaces are pure white for light theme
    val colorScheme = if (darkTheme) DarkColorScheme.copy(
        surface = Color.Black,
        surfaceContainer = Color.Black,
        surfaceContainerHigh = Color.Black,
        surfaceContainerHighest = Color.Black,
        surfaceContainerLow = Color.Black,
        surfaceContainerLowest = Color.Black
    ) else LightColorScheme.copy(
        surface = Color.White,
        surfaceContainer = Color.White,
        surfaceContainerHigh = Color.White,
        surfaceContainerHighest = Color.White,
        surfaceContainerLow = Color.White,
        surfaceContainerLowest = Color.White,
        surfaceVariant = Color.White,
        surfaceDim = Color.White,
        surfaceBright = Color.White
    )
    
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = colorScheme.surface.toArgb()
            window.navigationBarColor = colorScheme.surface.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = !darkTheme
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
} 