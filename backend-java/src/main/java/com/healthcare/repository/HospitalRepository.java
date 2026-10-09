package com.healthcare.repository;

import com.healthcare.entity.HospitalRegistry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HospitalRepository extends JpaRepository<HospitalRegistry, String> {
    List<HospitalRegistry> findByDistrictCode(String districtCode);
}
