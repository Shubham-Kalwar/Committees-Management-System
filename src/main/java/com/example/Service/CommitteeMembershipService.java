package com.example.Service;

import com.example.Entity.CommitteeMembership;
import java.util.List;

public interface CommitteeMembershipService {
    CommitteeMembership applyForCommittee(Integer userId, Integer committeeId, String applicationMessage);
    List<CommitteeMembership> getMembershipsByUser(Integer userId);
    List<CommitteeMembership> getMembershipsByCommittee(Integer committeeId);
    CommitteeMembership approveMembership(Long membershipId, Integer facultyUserId);
    CommitteeMembership rejectMembership(Long membershipId, Integer facultyUserId);
}
