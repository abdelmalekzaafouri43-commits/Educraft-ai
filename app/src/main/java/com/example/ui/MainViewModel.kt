package com.example.ui

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import androidx.room.Room
import com.example.api.AiService
import com.example.data.AppDatabase
import com.example.data.WorksheetEntity
import com.example.data.WorksheetRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class MainViewModel(application: Application) : AndroidViewModel(application) {
    private val db = Room.databaseBuilder(
        application,
        AppDatabase::class.java, "worksheet-database"
    ).build()
    
    private val repository = WorksheetRepository(db.worksheetDao())

    val savedWorksheets: StateFlow<List<WorksheetEntity>> = repository.allWorksheets
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // Generation state
    private val _isGenerating = MutableStateFlow(false)
    val isGenerating = _isGenerating.asStateFlow()

    private val _generatedWorksheet = MutableStateFlow<String?>(null)
    val generatedWorksheet = _generatedWorksheet.asStateFlow()

    // Chat state
    private val _chatMessages = MutableStateFlow<List<ChatMessage>>(emptyList())
    val chatMessages = _chatMessages.asStateFlow()

    init {
        // Initial welcome message
        _chatMessages.value = listOf(
            ChatMessage("Hello! I'm your AI English Tutor. How can I help you today?", isUser = false)
        )
    }

    fun generateWorksheet(topic: String, gradeLevel: String) {
        viewModelScope.launch {
            _isGenerating.value = true
            try {
                val result = AiService.generateWorksheet(topic, gradeLevel)
                _generatedWorksheet.value = result
            } finally {
                _isGenerating.value = false
            }
        }
    }
    
    fun clearGeneratedWorksheet() {
        _generatedWorksheet.value = null
    }

    fun saveCurrentWorksheet(title: String) {
        val content = _generatedWorksheet.value ?: return
        viewModelScope.launch {
            repository.insert(WorksheetEntity(title = title, content = content))
        }
    }

    fun deleteWorksheet(id: Int) {
        viewModelScope.launch {
            repository.delete(id)
        }
    }

    fun clearAllSavedData() {
        viewModelScope.launch {
            repository.clearAll()
            _chatMessages.value = listOf(
                ChatMessage("Hello! I'm your AI English Tutor. How can I help you today?", isUser = false)
            )
        }
    }

    fun sendChatMessage(message: String) {
        if (message.isBlank()) return
        
        val newMessages = _chatMessages.value.toMutableList()
        newMessages.add(ChatMessage(message, isUser = true))
        _chatMessages.value = newMessages

        viewModelScope.launch {
            val response = AiService.chatTutor(message)
            val updatedMessages = _chatMessages.value.toMutableList()
            updatedMessages.add(ChatMessage(response, isUser = false))
            _chatMessages.value = updatedMessages
        }
    }
}

data class ChatMessage(val text: String, val isUser: Boolean)
