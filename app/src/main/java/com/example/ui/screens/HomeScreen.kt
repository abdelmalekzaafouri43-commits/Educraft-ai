package com.example.ui.screens

import android.content.Intent
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.ui.MainViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(viewModel: MainViewModel) {
    val isGenerating by viewModel.isGenerating.collectAsStateWithLifecycle()
    val generatedWorksheet by viewModel.generatedWorksheet.collectAsStateWithLifecycle()

    var topic by remember { mutableStateOf("") }
    var gradeLevel by remember { mutableStateOf("Middle School") }
    
    val context = LocalContext.current

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .verticalScroll(rememberScrollState()),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text("AI Worksheet Generator", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
        Spacer(modifier = Modifier.height(24.dp))
        
        OutlinedTextField(
            value = topic,
            onValueChange = { topic = it },
            label = { Text("Topic (e.g., Past Tense Verbs)") },
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(modifier = Modifier.height(16.dp))
        
        OutlinedTextField(
            value = gradeLevel,
            onValueChange = { gradeLevel = it },
            label = { Text("Grade Level") },
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(modifier = Modifier.height(24.dp))
        
        Button(
            onClick = { viewModel.generateWorksheet(topic, gradeLevel) },
            modifier = Modifier.fillMaxWidth().height(56.dp),
            enabled = topic.isNotBlank() && !isGenerating
        ) {
            if (isGenerating) {
                CircularProgressIndicator(color = MaterialTheme.colorScheme.onPrimary, modifier = Modifier.size(24.dp))
                Spacer(modifier = Modifier.width(8.dp))
                Text("Generating...")
            } else {
                Text("Generate Worksheet")
            }
        }
        
        Spacer(modifier = Modifier.height(32.dp))
        
        generatedWorksheet?.let { content ->
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("Result", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(content, style = MaterialTheme.typography.bodyMedium)
                    Spacer(modifier = Modifier.height(16.dp))
                    
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
                        OutlinedButton(onClick = { viewModel.clearGeneratedWorksheet() }) {
                            Text("Clear")
                        }
                        Button(onClick = { 
                            val intent = Intent(Intent.ACTION_SEND).apply {
                                type = "text/plain"
                                putExtra(Intent.EXTRA_TITLE, "$topic Worksheet")
                                putExtra(Intent.EXTRA_TEXT, content)
                            }
                            context.startActivity(Intent.createChooser(intent, "Share Worksheet"))
                        }) {
                            Text("Share")
                        }
                        Button(onClick = { 
                            viewModel.saveCurrentWorksheet("$topic Worksheet")
                            viewModel.clearGeneratedWorksheet()
                        }) {
                            Text("Save")
                        }
                    }
                }
            }
        }
    }
}
