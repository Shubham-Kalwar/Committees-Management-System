package com.example.Service;

import com.example.Entity.Committee;
import com.example.Entity.CommitteeMembership;
import com.example.Entity.Users;
import com.example.Exception.ResourceNotFoundException;
import com.example.Repository.CommitteeMembershipRepository;
import com.example.Repository.CommitteeRepository;
import com.example.Repository.UsersRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class CommitteeMembershipServiceImpl implements CommitteeMembershipService {

    @Autowired
    private CommitteeMembershipRepository membershipRepository;

    @Autowired
    private UsersRepository usersRepository;

    @Autowired
    private CommitteeRepository committeeRepository;

    @Override
    public CommitteeMembership applyForCommittee(Integer userId, Integer committeeId, String applicationMessage) {
        Users user = usersRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        Committee committee = committeeRepository.findById(committeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Committee not found with id: " + committeeId));

        if (membershipRepository.existsByUserUserIdAndCommitteeCommitteeId(userId, committeeId)) {
            throw new IllegalStateException("User has already applied to this committee");
        }

        CommitteeMembership membership = new CommitteeMembership();
        membership.setUser(user);
        membership.setCommittee(committee);
        membership.setStatus("PENDING");
        membership.setApplicationMessage(applicationMessage);
        
        return membershipRepository.save(membership);
    }

    @Override
    public List<CommitteeMembership> getMembershipsByUser(Integer userId) {
        return membershipRepository.findByUserUserId(userId);
    }

    @Override
    public List<CommitteeMembership> getMembershipsByCommittee(Integer committeeId) {
        return membershipRepository.findByCommitteeCommitteeId(committeeId);
    }

    @Override
    public CommitteeMembership approveMembership(Long membershipId, Integer facultyUserId) {
        CommitteeMembership membership = membershipRepository.findById(membershipId)
                .orElseThrow(() -> new ResourceNotFoundException("Membership not found with id: " + membershipId));

        if (membership.getCommittee().getHead() == null || !membership.getCommittee().getHead().getUserId().equals(facultyUserId)) {
            throw new IllegalStateException("Only the designated faculty head of this committee can approve applications.");
        }

        Users facultyUser = usersRepository.findById(facultyUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty user not found"));

        membership.setStatus("APPROVED");
        membership.setApprovedAt(LocalDateTime.now());
        membership.setApprovedBy(facultyUser);
        
        return membershipRepository.save(membership);
    }

    @Override
    public CommitteeMembership rejectMembership(Long membershipId, Integer facultyUserId) {
        CommitteeMembership membership = membershipRepository.findById(membershipId)
                .orElseThrow(() -> new ResourceNotFoundException("Membership not found with id: " + membershipId));

        if (membership.getCommittee().getHead() == null || !membership.getCommittee().getHead().getUserId().equals(facultyUserId)) {
            throw new IllegalStateException("Only the designated faculty head of this committee can reject applications.");
        }

        Users facultyUser = usersRepository.findById(facultyUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty user not found"));

        membership.setStatus("REJECTED");
        membership.setApprovedBy(facultyUser);
        membership.setApprovedAt(LocalDateTime.now());
        
        return membershipRepository.save(membership);
    }
}
