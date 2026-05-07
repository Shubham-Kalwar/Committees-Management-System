package com.example.Controller;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.Entity.Users;
import com.example.Response.ResponceBean;
import com.example.Service.UsersService;
import com.example.Repository.UsersRepository;
import com.fasterxml.jackson.databind.ObjectMapper;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.security.core.context.SecurityContextHolder;

@RestController
@RequestMapping("/api/users")
@Tag(name = "User Management", description = "APIs for managing users")
public class UsersController {
    
    @Autowired
    private UsersService usersService;

    @Autowired
    private UsersRepository usersRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @PutMapping("/onboard")
    @Operation(summary = "Complete onboarding", description = "Complete the onboarding flow for the authenticated user")
    public ResponseEntity<ResponceBean<java.util.Map<String, Object>>> completeOnboarding(@RequestBody java.util.Map<String, Object> body) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        if (email == null || email.isBlank() || "anonymousUser".equalsIgnoreCase(email)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ResponceBean.error("Unauthorized"));
        }

        Optional<Users> userOpt = usersRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ResponceBean.error("User not found"));
        }

        Users user = userOpt.get();

        if (body.containsKey("name") && body.get("name") != null) {
            String name = String.valueOf(body.get("name")).trim();
            if (!name.isEmpty()) {
                user.setName(name);
            }
        }

        if (body.containsKey("department") && body.get("department") != null) {
            user.setDepartment(String.valueOf(body.get("department")).trim());
        }

        if (body.containsKey("year") && body.get("year") != null) {
            String year = String.valueOf(body.get("year")).trim();
            java.util.List<String> validYears = java.util.Arrays.asList("1st Year", "2nd Year", "3rd Year", "4th Year", "Post Graduate");
            if (!validYears.contains(year)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ResponceBean.error("Invalid year provided"));
            }
            user.setYear(year);
        }

        if (body.containsKey("interests") && body.get("interests") != null) {
            try {
                String interestsJson = objectMapper.writeValueAsString(body.get("interests"));
                user.setInterests(interestsJson);
            } catch (Exception e) {
                user.setInterests("[]");
            }
        }

        user.setIsOnboarded(true);
        usersRepository.save(user);

        java.util.Map<String, Object> response = new java.util.HashMap<>();
        response.put("userId", user.getUserId());
        response.put("name", user.getName());
        response.put("department", user.getDepartment());
        response.put("year", user.getYear());
        response.put("interests", user.getInterests());
        response.put("isOnboarded", true);

        return ResponseEntity.ok(ResponceBean.success("Onboarding completed successfully", response));
    }
    
    @GetMapping
    @Operation(summary = "Get all users", description = "Retrieve all users")
    public ResponseEntity<ResponceBean<List<Users>>> getAllUsers() {
        List<Users> users = usersService.getAllUsers();
        return ResponseEntity.ok(ResponceBean.success("Users retrieved successfully", users));
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Get user by ID", description = "Retrieve a specific user by ID")
    public ResponseEntity<ResponceBean<Users>> getUserById(@PathVariable Integer id) {
        Optional<Users> user = usersService.getUserById(id);
        if (user.isPresent()) {
            return ResponseEntity.ok(ResponceBean.success("User retrieved successfully", user.get()));
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ResponceBean.error("User not found"));
    }
    
    @GetMapping("/email/{email}")
    @Operation(summary = "Get user by email", description = "Retrieve user by email address")
    public ResponseEntity<ResponceBean<Users>> getUserByEmail(@PathVariable String email) {
        Optional<Users> user = usersService.getUserByEmail(email);
        if (user.isPresent()) {
            return ResponseEntity.ok(ResponceBean.success("User retrieved successfully", user.get()));
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ResponceBean.error("User not found"));
    }
    
    @GetMapping("/search")
    @Operation(summary = "Search users by name", description = "Search users by name containing keyword")
    public ResponseEntity<ResponceBean<List<Users>>> searchUsersByName(@RequestParam String name) {
        List<Users> users = usersService.getUsersByNameContaining(name);
        return ResponseEntity.ok(ResponceBean.success("Users found", users));
    }
    
    @PostMapping
    @Operation(summary = "Create new user", description = "Create a new user")
    public ResponseEntity<ResponceBean<Users>> createUser(@RequestBody Users user) {
        Users savedUser = usersService.saveUser(user);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ResponceBean.success("User created successfully", savedUser));
    }
    
    @PutMapping("/{id}")
    @Operation(summary = "Update user", description = "Update an existing user")
    public ResponseEntity<ResponceBean<Users>> updateUser(@PathVariable Integer id, @RequestBody Users userDetails) {
        Users updatedUser = usersService.updateUser(id, userDetails);
        if (updatedUser != null) {
            return ResponseEntity.ok(ResponceBean.success("User updated successfully", updatedUser));
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ResponceBean.error("User not found"));
    }

    @PatchMapping("/{id}")
    @Operation(summary = "Patch user", description = "Partially update an existing user")
    public ResponseEntity<ResponceBean<Users>> patchUser(@PathVariable Integer id, @RequestBody java.util.Map<String, Object> updates) {
        Optional<Users> existing = usersService.getUserById(id);
        if (existing.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ResponceBean.error("User not found"));
        }
        try {
            updates.remove("userId");
            updates.remove("createdAt");
            Users patched = objectMapper.updateValue(existing.get(), updates);
            Users saved = usersService.saveUser(patched);
            return ResponseEntity.ok(ResponceBean.success("User patched successfully", saved));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ResponceBean.error("Invalid patch payload", ex.getMessage()));
        }
    }
    
    @DeleteMapping("/{id}")
    @Operation(summary = "Delete user", description = "Delete a user")
    public ResponseEntity<ResponceBean<String>> deleteUser(@PathVariable Integer id) {
        Optional<Users> user = usersService.getUserById(id);
        if (user.isPresent()) {
            usersService.deleteUser(id);
            return ResponseEntity.ok(ResponceBean.success("User deleted successfully"));
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ResponceBean.error("User not found"));
    }
}