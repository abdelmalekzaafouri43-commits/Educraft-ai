package com.example.api

import kotlinx.coroutines.delay

/**
 * Placeholder service for Gemini API / OpenAI API.
 * 
 * TODO: Integrate the real Gemini REST API or Firebase AI here.
 * For Firebase AI, use `com.google.firebase:firebase-ai` and `GenerativeModel`.
 * For REST, use Retrofit with the endpoint:
 * https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${BuildConfig.GEMINI_API_KEY}
 */
object AiService {
    
    suspend fun generateWorksheet(topic: String, gradeLevel: String): String {
        // Simulate network delay
        delay(2000)
        return """
            # $topic Worksheet ($gradeLevel)
            
            ## Instructions
            Read the sentences below and answer the questions.
            
            1. What are three main facts about $topic?
            _________________________________________________________
            
            2. Write a short paragraph explaining the importance of $topic.
            _________________________________________________________
            
            ## Answer Key
            1. (Student's open-ended answers regarding $topic)
            2. (Paragraph should be coherent and factually accurate)
        """.trimIndent()
    }

    suspend fun chatTutor(message: String): String {
        // Simulate network delay
        delay(1000)
        if (message.contains("writing prompt", ignoreCase = true)) {
            return "Here's a writing prompt: Describe a typical day in the life of someone living in the year 2150. Focus on the technology they use and how they interact with others."
        }
        if (message.contains("explain", ignoreCase = true)) {
            return "I can certainly explain that! The word is a noun that means... (This is a mock AI response. Integrate real Gemini API to provide dynamic definitions)."
        }
        return "That's a great observation! Let's explore that further. (Mock AI Response)"
    }
}
