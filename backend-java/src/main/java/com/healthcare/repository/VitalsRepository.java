package com.healthcare.repository;

import com.healthcare.entity.VitalsTimeseries;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VitalsRepository extends JpaRepository<VitalsTimeseries, String> {
    List<VitalsTimeseries> findByUserIdOrderByRecordedAtDesc(String userId, Pageable pageable);
    long countByUrgencyLevel(String urgencyLevel);
}
