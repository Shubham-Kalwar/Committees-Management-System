package com.example.Repository;

import com.example.Entity.CommitteeMembership;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CommitteeMembershipRepository extends JpaRepository<CommitteeMembership, Long> {
    List<CommitteeMembership> findByUserUserId(Integer userId);
    List<CommitteeMembership> findByCommitteeCommitteeId(Integer committeeId);
    Optional<CommitteeMembership> findByUserUserIdAndCommitteeCommitteeId(Integer userId, Integer committeeId);

    boolean existsByUserUserIdAndCommitteeCommitteeId(Integer userId, Integer committeeId);
}
