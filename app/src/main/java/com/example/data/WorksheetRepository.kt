package com.example.data

import kotlinx.coroutines.flow.Flow

class WorksheetRepository(private val dao: WorksheetDao) {
    val allWorksheets: Flow<List<WorksheetEntity>> = dao.getAllWorksheets()
    
    suspend fun insert(worksheet: WorksheetEntity) {
        dao.insertWorksheet(worksheet)
    }
    
    suspend fun delete(worksheetId: Int) {
        dao.deleteWorksheetById(worksheetId)
    }

    suspend fun clearAll() {
        dao.clearAll()
    }
}
