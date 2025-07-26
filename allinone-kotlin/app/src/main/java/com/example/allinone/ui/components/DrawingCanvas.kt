package com.example.allinone.ui.components

import android.content.ContentValues
import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas as AndroidCanvas
import android.graphics.Paint as AndroidPaint
import android.graphics.Path as AndroidPath
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.asAndroidPath
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.core.content.FileProvider
import java.io.File
import java.io.FileOutputStream
import java.io.IOException
import java.io.OutputStream
import java.text.SimpleDateFormat
import java.util.*
import kotlin.math.*

@Composable
fun DrawingCanvas(
    modifier: Modifier = Modifier,
    onDrawingChange: (Boolean) -> Unit = {},
    onSaveSuccess: (Uri) -> Unit = {},
    onSaveError: (String) -> Unit = {},
    saveToGallery: Boolean = false
) {
    val context = LocalContext.current
    
    // Drawing state
    var paths by remember { mutableStateOf(listOf<PathData>()) }
    var currentPath by remember { mutableStateOf(PathData()) }
    var isDrawing by remember { mutableStateOf(false) }
    
    // Drawing settings - matching existing DrawingView defaults
    var currentColor by remember { mutableStateOf(Color.Black) }
    var brushSize by remember { mutableStateOf(12f) } // Default 12 like original
    var showColorPicker by remember { mutableStateOf(false) }
    var brightness by remember { mutableStateOf(1.0f) }
    
    // Track if there are any changes
    var hasChanges by remember { mutableStateOf(false) }
    
    // Touch tolerance matching original
    val touchTolerance = 4f
    
    LaunchedEffect(hasChanges) {
        onDrawingChange(hasChanges)
    }

    Column(modifier = modifier) {
        // Drawing area
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(400.dp)
                .background(Color.White)
                .border(1.dp, Color.Gray)
        ) {
            Canvas(
                modifier = Modifier
                    .fillMaxSize()
                    .pointerInput(Unit) {
                        detectDragGestures(
                            onDragStart = { offset ->
                                currentPath = PathData(
                                    path = Path().apply { moveTo(offset.x, offset.y) },
                                    color = currentColor,
                                    strokeWidth = brushSize,
                                    lastPoint = offset
                                )
                                isDrawing = true
                                hasChanges = true
                            },
                            onDrag = { _, dragAmount ->
                                val newPath = currentPath.path
                                val lastPoint = currentPath.lastPoint
                                val newPoint = lastPoint + dragAmount
                                
                                // Use original touch tolerance
                                val dx = abs(newPoint.x - lastPoint.x)
                                val dy = abs(newPoint.y - lastPoint.y)
                                
                                if (dx >= touchTolerance || dy >= touchTolerance) {
                                    newPath.quadraticTo(
                                        lastPoint.x, lastPoint.y,
                                        (newPoint.x + lastPoint.x) / 2, (newPoint.y + lastPoint.y) / 2
                                    )
                                    currentPath = currentPath.copy(
                                        path = newPath,
                                        lastPoint = newPoint
                                    )
                                }
                            },
                            onDragEnd = {
                                val finalPath = currentPath.path
                                finalPath.lineTo(currentPath.lastPoint.x, currentPath.lastPoint.y)
                                paths = paths + currentPath.copy(path = finalPath)
                                currentPath = PathData()
                                isDrawing = false
                            }
                        )
                    }
            ) {
                drawRect(Color.White, size = size)
                
                // Draw completed paths
                paths.forEach { pathData ->
                    drawPath(
                        path = pathData.path,
                        color = pathData.color,
                        style = Stroke(
                            width = pathData.strokeWidth,
                            cap = StrokeCap.Round,
                            join = StrokeJoin.Round
                        )
                    )
                }
                
                // Draw current path
                if (isDrawing) {
                    drawPath(
                        path = currentPath.path,
                        color = currentPath.color,
                        style = Stroke(
                            width = currentPath.strokeWidth,
                            cap = StrokeCap.Round,
                            join = StrokeJoin.Round
                        )
                    )
                }
            }
        }
        
        // Controls
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 8.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFFF5F5F5))
        ) {
            Column(
                modifier = Modifier.padding(16.dp)
            ) {
                // Color and Brush Controls
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Color section
                    Column(
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Color", fontSize = 12.sp, fontWeight = FontWeight.Medium)
                        Spacer(modifier = Modifier.height(4.dp))
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(40.dp)
                                    .background(currentColor, CircleShape)
                                    .border(1.dp, Color.Gray, CircleShape)
                            )
                            IconButton(
                                onClick = { showColorPicker = true }
                            ) {
                                Icon(
                                    Icons.Default.Palette,
                                    contentDescription = "Choose Color",
                                    tint = Color.Gray
                                )
                            }
                        }
                    }
                    
                    // Brush size section - matching original range 1-50
                    Column(
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Brush Size", fontSize = 12.sp, fontWeight = FontWeight.Medium)
                        Spacer(modifier = Modifier.height(4.dp))
                        Slider(
                            value = brushSize,
                            onValueChange = { brushSize = it },
                            valueRange = 1f..50f, // Original range
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                }
                
                Spacer(modifier = Modifier.height(16.dp))
                
                // Action buttons
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedButton(
                        onClick = {
                            paths = emptyList()
                            currentPath = PathData()
                            hasChanges = false
                        },
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Clear")
                    }
                    
                    Button(
                        onClick = {
                            saveDrawing(
                                context = context,
                                paths = paths,
                                currentPath = if (isDrawing) currentPath else null,
                                saveToGallery = saveToGallery,
                                onSuccess = { uri ->
                                    onSaveSuccess(uri)
                                    hasChanges = false
                                },
                                onError = onSaveError
                            )
                        },
                        modifier = Modifier.weight(1f),
                        enabled = hasChanges
                    ) {
                        Text("Save")
                    }
                }
            }
        }
    }
    
    // Color picker dialog with color wheel
    if (showColorPicker) {
        ColorWheelDialog(
            initialColor = currentColor,
            initialBrightness = brightness,
            onColorSelected = { color, newBrightness ->
                currentColor = color
                brightness = newBrightness
                showColorPicker = false
            },
            onDismiss = { showColorPicker = false }
        )
    }
}

@Composable
private fun ColorWheelDialog(
    initialColor: Color,
    initialBrightness: Float,
    onColorSelected: (Color, Float) -> Unit,
    onDismiss: () -> Unit
) {
    var selectedColor by remember { mutableStateOf(initialColor) }
    var brightness by remember { mutableStateOf(initialBrightness) }
    
    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .width(300.dp)
                .wrapContentHeight(),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(
                modifier = Modifier.padding(16.dp)
            ) {
                Text(
                    text = "Choose Color",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                // Color wheel
                ColorWheelView(
                    modifier = Modifier.size(240.dp),
                    initialColor = selectedColor,
                    brightness = brightness,
                    onColorChange = { color ->
                        selectedColor = color
                    }
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                // Brightness slider
                Text("Brightness", fontSize = 14.sp, fontWeight = FontWeight.Medium)
                Spacer(modifier = Modifier.height(8.dp))
                Slider(
                    value = brightness,
                    onValueChange = { newBrightness ->
                        brightness = newBrightness
                        // Apply brightness to current color
                        val hsv = FloatArray(3)
                        android.graphics.Color.colorToHSV(selectedColor.toArgb(), hsv)
                        hsv[2] = newBrightness
                        selectedColor = Color(android.graphics.Color.HSVToColor(hsv))
                    },
                    valueRange = 0f..1f,
                    modifier = Modifier.fillMaxWidth()
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                // Buttons
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    TextButton(
                        onClick = onDismiss,
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Cancel")
                    }
                    
                    Button(
                        onClick = { onColorSelected(selectedColor, brightness) },
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("OK")
                    }
                }
            }
        }
    }
}

@Composable
private fun ColorWheelView(
    modifier: Modifier = Modifier,
    initialColor: Color,
    brightness: Float,
    onColorChange: (Color) -> Unit
) {
    val colors = remember {
        listOf(
            Color.Red, 
            Color.Magenta, 
            Color.Blue, 
            Color.Cyan,
            Color.Green, 
            Color.Yellow, 
            Color.Red
        )
    }
    
    var centerColor by remember { mutableStateOf(initialColor) }
    
    Canvas(
        modifier = modifier
            .pointerInput(Unit) {
                detectDragGestures(
                    onDragStart = { offset ->
                        val center = Offset(size.width / 2f, size.height / 2f)
                        val radius = minOf(size.width, size.height) / 2f - 10.dp.toPx()
                        val centerRadius = 32.dp.toPx()
                        
                        val dx = offset.x - center.x
                        val dy = offset.y - center.y
                        val distance = sqrt(dx * dx + dy * dy)
                        
                        if (distance > centerRadius && distance <= radius) {
                            val angle = atan2(dy, dx)
                            val unit = ((angle / (2 * PI)) + 1) % 1
                            
                            // Interpolate color like original
                            val p = unit * (colors.size - 1)
                            val i = p.toInt()
                            val fraction = (p - i).toFloat()
                            
                            val c0 = colors[i]
                            val c1 = colors[minOf(i + 1, colors.size - 1)]
                            
                            // Interpolate RGB components
                            val interpolatedColor = Color(
                                red = c0.red + fraction * (c1.red - c0.red),
                                green = c0.green + fraction * (c1.green - c0.green),
                                blue = c0.blue + fraction * (c1.blue - c0.blue)
                            )
                            
                            // Apply brightness
                            val hsv = FloatArray(3)
                            android.graphics.Color.colorToHSV(interpolatedColor.toArgb(), hsv)
                            hsv[2] = brightness
                            val finalColor = Color(android.graphics.Color.HSVToColor(hsv))
                            
                            centerColor = finalColor
                            onColorChange(finalColor)
                        }
                    },
                    onDrag = { _, _ ->
                        // Handle ongoing drag if needed
                    }
                )
            }
    ) {
        val center = Offset(size.width / 2f, size.height / 2f)
        val outerRadius = minOf(size.width, size.height) / 2f - 10.dp.toPx()
        val innerRadius = 32.dp.toPx()
        
        // Draw color wheel
        drawCircle(
            brush = Brush.sweepGradient(
                colors = colors.map { color ->
                    val hsv = FloatArray(3)
                    android.graphics.Color.colorToHSV(color.toArgb(), hsv)
                    hsv[2] = brightness
                    Color(android.graphics.Color.HSVToColor(hsv))
                },
                center = center
            ),
            radius = outerRadius,
            center = center
        )
        
        // Draw center circle
        drawCircle(
            color = centerColor,
            radius = innerRadius,
            center = center
        )
        
        // Draw center circle outline
        drawCircle(
            color = Color.Gray,
            radius = innerRadius,
            center = center,
            style = Stroke(width = 2.dp.toPx())
        )
    }
}

private data class PathData(
    val path: Path = Path(),
    val color: Color = Color.Black,
    val strokeWidth: Float = 12f,
    val lastPoint: Offset = Offset.Zero
)

private fun saveDrawing(
    context: Context,
    paths: List<PathData>,
    currentPath: PathData?,
    saveToGallery: Boolean,
    onSuccess: (Uri) -> Unit,
    onError: (String) -> Unit
) {
    try {
        // Create bitmap from paths
        val bitmap = createBitmapFromPaths(paths, currentPath)
        
        // Save file
        val timeStamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(Date())
        val fileName = "Drawing_$timeStamp.png"
        
        val uri = if (saveToGallery) {
            saveImageToGallery(context, bitmap, fileName)
        } else {
            saveImageToInternal(context, bitmap, fileName)
        }
        
        onSuccess(uri)
    } catch (e: Exception) {
        onError("Error saving drawing: ${e.message}")
    }
}

private fun createBitmapFromPaths(paths: List<PathData>, currentPath: PathData?): Bitmap {
    val bitmap = Bitmap.createBitmap(800, 600, Bitmap.Config.ARGB_8888)
    val canvas = AndroidCanvas(bitmap)
    
    // White background
    canvas.drawColor(android.graphics.Color.WHITE)
    
    // Draw paths
    paths.forEach { pathData ->
        val paint = AndroidPaint().apply {
            color = pathData.color.toArgb()
            strokeWidth = pathData.strokeWidth
            style = AndroidPaint.Style.STROKE
            strokeCap = AndroidPaint.Cap.ROUND
            strokeJoin = AndroidPaint.Join.ROUND
            isAntiAlias = true
            isDither = true
        }
        canvas.drawPath(pathData.path.asAndroidPath(), paint)
    }
    
    // Draw current path if exists
    currentPath?.let { pathData ->
        val paint = AndroidPaint().apply {
            color = pathData.color.toArgb()
            strokeWidth = pathData.strokeWidth
            style = AndroidPaint.Style.STROKE
            strokeCap = AndroidPaint.Cap.ROUND
            strokeJoin = AndroidPaint.Join.ROUND
            isAntiAlias = true
            isDither = true
        }
        canvas.drawPath(pathData.path.asAndroidPath(), paint)
    }
    
    return bitmap
}

private fun saveImageToInternal(context: Context, bitmap: Bitmap, fileName: String): Uri {
    val file = File(context.filesDir, fileName)
    FileOutputStream(file).use { out ->
        bitmap.compress(Bitmap.CompressFormat.PNG, 100, out)
    }
    
    if (!file.exists()) {
        throw IOException("Failed to create file in internal storage")
    }
    
    return FileProvider.getUriForFile(
        context,
        "${context.packageName}.provider",
        file
    )
}

private fun saveImageToGallery(context: Context, bitmap: Bitmap, fileName: String): Uri {
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        val contentValues = ContentValues().apply {
            put(MediaStore.MediaColumns.DISPLAY_NAME, fileName)
            put(MediaStore.MediaColumns.MIME_TYPE, "image/png")
            put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_PICTURES)
        }
        
        val uri = context.contentResolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, contentValues)!!
        context.contentResolver.openOutputStream(uri)!!.use { outputStream ->
            bitmap.compress(Bitmap.CompressFormat.PNG, 100, outputStream)
        }
        uri
    } else {
        val imagesDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES)
        val image = File(imagesDir, fileName)
        FileOutputStream(image).use { outputStream ->
            bitmap.compress(Bitmap.CompressFormat.PNG, 100, outputStream)
        }
        
        val contentValues = ContentValues().apply {
            put(MediaStore.Images.Media.DATA, image.absolutePath)
            put(MediaStore.Images.Media.MIME_TYPE, "image/png")
        }
        
        context.contentResolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, contentValues)!!
    }
} 