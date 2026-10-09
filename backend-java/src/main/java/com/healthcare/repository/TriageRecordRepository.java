package com.healthcare.repository;

import com.healthcare.entity.TriageRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TriageRecordRepository extends JpaRepository<TriageRecord, String> {
    List<TriageRecord> findByHospitalAcknowledgedFalseOrderByCreatedAtDesc();
    List<TriageRecord> findByUserIdOrderByCreatedAtDesc(String userId);
}
