package com.example.Entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

import org.hibernate.annotations.UpdateTimestamp;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "committee_membership", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "committee_id"})
})
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class CommitteeMembership {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long membershipId;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private Users user;

    @ManyToOne
    @JoinColumn(name = "committee_id", nullable = false)
    private Committee committee;

    @Column(nullable = false)
    private String status; // PENDING, APPROVED, REJECTED

    @Column(name = "applied_at")
    private LocalDateTime appliedAt;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    @JsonIgnoreProperties({"password", "roles", "announcements", "events", "tasks", "attendanceRecords", "markedAttendanceRecords", "createdAt", "updatedAt"})
    private Users approvedBy;

    @Column(name = "role_in_committee", length = 50)
    private String roleInCommittee = "MEMBER";

    @Column(name = "application_message", columnDefinition = "TEXT")
    private String applicationMessage;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        appliedAt = LocalDateTime.now();
    }

    public Long getMembershipId() { return membershipId; }
    public void setMembershipId(Long membershipId) { this.membershipId = membershipId; }
    public Users getUser() { return user; }
    public void setUser(Users user) { this.user = user; }
    public Committee getCommittee() { return committee; }
    public void setCommittee(Committee committee) { this.committee = committee; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getAppliedAt() { return appliedAt; }
    public void setAppliedAt(LocalDateTime appliedAt) { this.appliedAt = appliedAt; }
    public LocalDateTime getApprovedAt() { return approvedAt; }
    public void setApprovedAt(LocalDateTime approvedAt) { this.approvedAt = approvedAt; }
    public Users getApprovedBy() { return approvedBy; }
    public void setApprovedBy(Users approvedBy) { this.approvedBy = approvedBy; }
    public String getRoleInCommittee() { return roleInCommittee; }
    public void setRoleInCommittee(String roleInCommittee) { this.roleInCommittee = roleInCommittee; }
    public String getApplicationMessage() { return applicationMessage; }
    public void setApplicationMessage(String applicationMessage) { this.applicationMessage = applicationMessage; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
