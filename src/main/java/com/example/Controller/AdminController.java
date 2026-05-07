package com.example.Controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.Entity.Committee;
import com.example.Entity.Login;
import com.example.Entity.Roles;
import com.example.Entity.Users;
import com.example.Repository.CommitteeRepository;
import com.example.Repository.LoginRepository;
import com.example.Repository.RolesRepository;
import com.example.Repository.UsersRepository;
import com.example.Response.ResponceBean;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    @Autowired
    private LoginRepository loginRepository;

    @Autowired
    private UsersRepository usersRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private CommitteeRepository committeeRepository;

    @Autowired
    private RolesRepository rolesRepository;

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/faculty/create")
    public ResponseEntity<ResponceBean<Map<String, Object>>> createFaculty(@RequestBody CreateFacultyRequest request) {
        try {
            if (request.getEmail() == null || request.getEmail().isBlank()) {
                return ResponseEntity.badRequest().body(new ResponceBean<>(false, "Email is required"));
            }
            if (request.getPassword() == null || request.getPassword().length() < 6) {
                return ResponseEntity.badRequest().body(new ResponceBean<>(false, "Password must be at least 6 characters"));
            }
            if (request.getName() == null || request.getName().isBlank()) {
                return ResponseEntity.badRequest().body(new ResponceBean<>(false, "Name is required"));
            }
            
            // Check if email already exists
            if (loginRepository.existsByEmail(request.getEmail())) {
                return ResponseEntity.badRequest().body(new ResponceBean<>(false, "Email already exists"));
            }

            // Create Login entity
            Login login = new Login();
            login.setEmail(request.getEmail());
            login.setPassword(passwordEncoder.encode(request.getPassword()));
            login.setRole("FACULTY");

            Roles role = rolesRepository.findByRoleName("FACULTY").stream().findFirst().orElse(null);
            login.setRoleRef(role);
            loginRepository.save(login);

            // Create Users entity
            Users user = new Users();
            user.setName(request.getName());
            user.setLogin(login);
            user.setIsOnboarded(true); // Faculty does not need onboarding
            user.setAccountStatus("ACTIVE");
            usersRepository.save(user);

            // If a committee is provided, link it
            if (request.getCommitteeId() != null) {
                Committee committee = committeeRepository.findById(request.getCommitteeId()).orElse(null);
                if (committee != null) {
                    // Update committee faculty in charge
                    committee.setFacultyInchargeName(request.getName());
                    committee.setLogin(login);
                    committeeRepository.save(committee);
                }
            }

            Map<String, Object> response = new HashMap<>();
            response.put("email", login.getEmail());
            response.put("name", user.getName());
            response.put("role", login.getRole());

            return ResponseEntity.ok(new ResponceBean<>(true, "Faculty created successfully", response));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ResponceBean<>(false, "Failed to create faculty: " + e.getMessage()));
        }
    }

    public static class CreateFacultyRequest {
        private String name;
        private String email;
        private String password;
        private Integer committeeId;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
        public Integer getCommitteeId() { return committeeId; }
        public void setCommitteeId(Integer committeeId) { this.committeeId = committeeId; }
    }
}
