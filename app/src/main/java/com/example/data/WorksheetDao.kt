package com.example.data

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface WorksheetDao {
    @Query("SELECT * FROM worksheets ORDER BY dateSaved DESC")
    fun getAllWorksheets(): Flow<List<WorksheetEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertWorksheet(worksheet: WorksheetEntity)

    @Query("DELETE FROM worksheets WHERE id = :id")
    suspend fun deleteWorksheetById(id: Int)
    
    @Query("DELETE FROM worksheets")
    suspend fun clearAll()
}
