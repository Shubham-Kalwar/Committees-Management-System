package com.example.Repository;

import com.example.Entity.Committee;
import com.example.Entity.Login;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CommitteeRepository extends JpaRepository<Committee, Integer> {
    
    Optional<Committee> findByLogin(Login login);
    
    @Query("SELECT c FROM Committee c WHERE c.committeeName LIKE %:name%")
    List<Committee> findByCommitteeNameContaining(@Param("name") String name);
    
    List<Committee> findByFacultyInchargeName(String facultyName);
    
    @Query("SELECT c FROM Committee c WHERE c.committeeInfo LIKE %:info%")
    List<Committee> findByCommitteeInfoContaining(@Param("info") String info);
    
    boolean existsByCommitteeName(String committeeName);

    @Query("SELECT CASE WHEN COUNT(c) > 0 THEN true ELSE false END FROM Committee c WHERE LOWER(TRIM(c.committeeName)) = LOWER(TRIM(:name))")
    boolean existsByCommitteeNameIgnoreCase(@Param("name") String committeeName);

    @Query("SELECT CASE WHEN COUNT(c) > 0 THEN true ELSE false END FROM Committee c WHERE LOWER(TRIM(c.committeeName)) = LOWER(TRIM(:name)) AND c.committeeId <> :excludeId")
    boolean existsByCommitteeNameIgnoreCaseAndIdNot(@Param("name") String committeeName, @Param("excludeId") Integer excludeId);

    List<Committee> findByHeadUserId(Integer headId);
}