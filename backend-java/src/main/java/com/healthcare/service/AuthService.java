package com.healthcare.service;

import com.healthcare.dto.LoginRequest;
import com.healthcare.dto.RegisterRequest;
import com.healthcare.dto.UserDTO;
import com.healthcare.entity.User;
import com.healthcare.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AuthService {

    private final UserRepository userRepository;

    public AuthService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    private String generatePhoneHash(String phone) {
        int hash = phone != null ? phone.hashCode() : 0;
        return String.format("HASH-%08x", hash & 0xFFFFFFFFL);
    }

    @Transactional
    public UserDTO registerUser(RegisterRequest req) {
        String phoneHash = generatePhoneHash(req.getPhoneNumber());
        User user = userRepository.findByPhoneHash(phoneHash).orElse(null);

        if (user == null) {
            user = new User();
            user.setId(UUID.randomUUID().toString());
            user.setFullName(req.getFullName());
            user.setPhoneHash(phoneHash);
            user.setVillageCode(req.getVillageCode());
            user.setRole(req.getRole() != null ? req.getRole() : "Patient");
            user.setPreferredLang(req.getPreferredLang() != null ? req.getPreferredLang() : "te-IN");
            user.setLatitude(req.getLatitude());
            user.setLongitude(req.getLongitude());
            user.setLocationName(req.getLocationName());
            user = userRepository.save(user);
        } else {
            if (req.getLatitude() != null && req.getLongitude() != null) {
                user.setLatitude(req.getLatitude());
                user.setLongitude(req.getLongitude());
            }
            if (req.getLocationName() != null) {
                user.setLocationName(req.getLocationName());
            }
            user = userRepository.save(user);
        }

        return toDTO(user);
    }

    @Transactional
    public UserDTO loginUser(LoginRequest req) {
        String phoneHash = generatePhoneHash(req.getPhoneNumber());
        User user = userRepository.findByPhoneHash(phoneHash).orElse(null);

        if (user == null) {
            user = new User();
            user.setId(UUID.randomUUID().toString());
            user.setFullName("Registered Patient");
            user.setPhoneHash(phoneHash);
            user.setVillageCode("Cluster-104");
            user.setRole("Patient");
            user.setPreferredLang("te-IN");
            user.setLatitude(req.getLatitude());
            user.setLongitude(req.getLongitude());
            user.setLocationName(req.getLocationName());
            user = userRepository.save(user);
        } else {
            if (req.getLatitude() != null && req.getLongitude() != null) {
                user.setLatitude(req.getLatitude());
                user.setLongitude(req.getLongitude());
            }
            if (req.getLocationName() != null) {
                user.setLocationName(req.getLocationName());
            }
            user = userRepository.save(user);
        }

        return toDTO(user);
    }

    public List<UserDTO> getAllUsers() {
        return userRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .limit(20)
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public UserDTO toDTO(User u) {
        return new UserDTO(
                u.getId(),
                u.getFullName(),
                u.getPhoneHash(),
                u.getVillageCode(),
                u.getRole(),
                u.getPreferredLang(),
                u.getLatitude(),
                u.getLongitude(),
                u.getLocationName(),
                u.getCreatedAt()
        );
    }
}
