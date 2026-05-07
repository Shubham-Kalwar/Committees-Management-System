package com.example.Controller;

import com.example.Entity.CommitteeMembership;
import com.example.Entity.Users;
import com.example.Exception.ResourceNotFoundException;
import com.example.Repository.UsersRepository;
import com.example.Response.ResponceBean;
import com.example.Service.CommitteeMembershipService;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/committee")
@Tag(name = "Committee Membership", description = "APIs for student committee applications")
public class CommitteeMembershipController {

    @Autowired
    private CommitteeMembershipService membershipService;

    @Autowired
    private UsersRepository usersRepository;

    public static class ApplyRequest {
        @JsonProperty("committee_id")
        private Integer committeeId;

        @JsonProperty("application_message")
        private String applicationMessage;

        public Integer getCommitteeId() {
            return committeeId;
        }

        public void setCommitteeId(Integer committeeId) {
            this.committeeId = committeeId;
        }

        public String getApplicationMessage() {
            return applicationMessage;
        }

        public void setApplicationMessage(String applicationMessage) {
            this.applicationMessage = applicationMessage;
        }
    }

    @PostMapping("/apply")
    @Operation(summary = "Apply for a committee", description = "Student applies to join a committee")
    public ResponseEntity<ResponceBean<CommitteeMembership>> apply(@RequestBody ApplyRequest request) {
        if (request.getCommitteeId() == null) {
            return ResponseEntity.badRequest().body(ResponceBean.error("committee_id is required"));
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equalsIgnoreCase(authentication.getName())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ResponceBean.error("Unauthorized"));
        }

        Users user = usersRepository.findByEmail(authentication.getName())
                .orElse(null);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ResponceBean.error("User not found"));
        }

        try {
            CommitteeMembership membership = membershipService.applyForCommittee(user.getUserId(), request.getCommitteeId(), request.getApplicationMessage());
            return ResponseEntity.status(HttpStatus.CREATED).body(ResponceBean.success("Successfully applied for committee", membership));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(ResponceBean.error(ex.getMessage()));
        } catch (ResourceNotFoundException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ResponceBean.error(ex.getMessage()));
        }
    }

    @GetMapping("/my")
    @Operation(summary = "Get my memberships", description = "Get current user's committee memberships")
    public ResponseEntity<ResponceBean<List<CommitteeMembership>>> getMyMemberships() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equalsIgnoreCase(authentication.getName())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ResponceBean.error("Unauthorized"));
        }

        Users user = usersRepository.findByEmail(authentication.getName())
                .orElse(null);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ResponceBean.error("User not found"));
        }

        List<CommitteeMembership> memberships = membershipService.getMembershipsByUser(user.getUserId());
        return ResponseEntity.ok(ResponceBean.success("Memberships retrieved successfully", memberships));
    }

    @GetMapping("/applications/{committeeId}")
    @Operation(summary = "Get committee applications", description = "Get pending applications for a committee (Faculty only)")
    public ResponseEntity<ResponceBean<List<CommitteeMembership>>> getCommitteeApplications(@PathVariable Integer committeeId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equalsIgnoreCase(authentication.getName())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ResponceBean.error("Unauthorized"));
        }

        List<CommitteeMembership> memberships = membershipService.getMembershipsByCommittee(committeeId);
        // Only return PENDING applications for faculty view (or all, but front-end can filter)
        // Let's return all to allow the faculty to see rejected/approved too if needed.
        return ResponseEntity.ok(ResponceBean.success("Applications retrieved successfully", memberships));
    }

    @PutMapping("/approve/{id}")
    @Operation(summary = "Approve membership", description = "Approve a pending committee application")
    public ResponseEntity<ResponceBean<CommitteeMembership>> approve(@PathVariable Long id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equalsIgnoreCase(authentication.getName())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ResponceBean.error("Unauthorized"));
        }
        Users user = usersRepository.findByEmail(authentication.getName()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ResponceBean.error("User not found"));
        }

        try {
            CommitteeMembership membership = membershipService.approveMembership(id, user.getUserId());
            return ResponseEntity.ok(ResponceBean.success("Application approved successfully", membership));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ResponceBean.error(ex.getMessage()));
        } catch (ResourceNotFoundException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ResponceBean.error(ex.getMessage()));
        }
    }

    @PutMapping("/reject/{id}")
    @Operation(summary = "Reject membership", description = "Reject a pending committee application")
    public ResponseEntity<ResponceBean<CommitteeMembership>> reject(@PathVariable Long id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equalsIgnoreCase(authentication.getName())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ResponceBean.error("Unauthorized"));
        }
        Users user = usersRepository.findByEmail(authentication.getName()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ResponceBean.error("User not found"));
        }

        try {
            CommitteeMembership membership = membershipService.rejectMembership(id, user.getUserId());
            return ResponseEntity.ok(ResponceBean.success("Application rejected successfully", membership));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ResponceBean.error(ex.getMessage()));
        } catch (ResourceNotFoundException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ResponceBean.error(ex.getMessage()));
        }
    }
}
