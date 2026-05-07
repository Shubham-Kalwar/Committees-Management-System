package com.example.Service;

import java.util.List;
import java.util.Objects;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.Entity.Committee;
import com.example.Entity.Login;
import com.example.Exception.DuplicateCommitteeException;
import com.example.Exception.ResourceNotFoundException;
import com.example.Repository.CommitteeRepository;

@Service
public class CommitteeServiceImpl implements CommitteeService {

    @Autowired
    private CommitteeRepository committeeRepository;

    @Override
    public List<Committee> getAllCommittees() {
        return committeeRepository.findAll();
    }

    @Override
    public Optional<Committee> getCommitteeById(Integer id) {
        return committeeRepository.findById(Objects.requireNonNull(id, "id must not be null"));
    }

    @Override
    public Optional<Committee> getCommitteeByLogin(Login login) {
        return committeeRepository.findByLogin(login);
    }

    @Override
    public List<Committee> getCommitteesByNameContaining(String name) {
        return committeeRepository.findByCommitteeNameContaining(name);
    }

    @Override
    public List<Committee> getCommitteesByFacultyName(String facultyName) {
        return committeeRepository.findByFacultyInchargeName(facultyName);
    }

    @Override
    public Committee saveCommittee(Committee committee) {
        Objects.requireNonNull(committee, "committee must not be null");

        // Normalize the name: trim whitespace
        String normalizedName = normalizeCommitteeName(committee.getCommitteeName());
        committee.setCommitteeName(normalizedName);

        // Check for duplicates (case-insensitive) on new committees
        if (committee.getCommitteeId() == null && committeeRepository.existsByCommitteeNameIgnoreCase(normalizedName)) {
            throw new DuplicateCommitteeException(normalizedName);
        }

        return committeeRepository.save(committee);
    }

    @Override
    public void deleteCommittee(Integer id) {
        if (!committeeRepository.existsById(Objects.requireNonNull(id, "id must not be null"))) {
            throw new ResourceNotFoundException("Committee not found with id: " + id);
        }
        committeeRepository.deleteById(id);
    }

    @Override
    public Committee updateCommittee(Integer id, Committee committeeDetails) {
        Objects.requireNonNull(id, "id must not be null");
        Committee committee = committeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Committee not found with id: " + id));

        String normalizedName = normalizeCommitteeName(committeeDetails.getCommitteeName());

        // Check for name conflicts with OTHER committees (case-insensitive)
        if (committeeRepository.existsByCommitteeNameIgnoreCaseAndIdNot(normalizedName, id)) {
            throw new DuplicateCommitteeException(normalizedName);
        }

        committee.setCommitteeName(normalizedName);
        committee.setFacultyInchargeName(committeeDetails.getFacultyInchargeName());
        committee.setFacultyPosition(committeeDetails.getFacultyPosition());
        committee.setCommitteeInfo(committeeDetails.getCommitteeInfo());
        return committeeRepository.save(committee);
    }

    /**
     * Normalizes committee name by trimming leading/trailing whitespace.
     */
    private String normalizeCommitteeName(String name) {
        if (name == null || name.isBlank()) {
            return name;
        }
        return name.trim();
    }
}
