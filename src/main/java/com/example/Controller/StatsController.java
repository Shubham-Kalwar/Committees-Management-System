package com.example.Controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.Repository.CommitteeRepository;
import com.example.Repository.EventsRepository;
import com.example.Repository.UsersRepository;
import com.example.Response.ResponceBean;

@RestController
@RequestMapping("/api/stats")
@CrossOrigin(origins = "*")
public class StatsController {

    @Autowired
    private CommitteeRepository committeeRepository;

    @Autowired
    private EventsRepository eventsRepository;

    @Autowired
    private UsersRepository usersRepository;

    @GetMapping
    public ResponseEntity<ResponceBean<Map<String, Object>>> getStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalCommittees", committeeRepository.count());
        stats.put("totalEvents", eventsRepository.count());
        stats.put("totalUsers", usersRepository.count());
        return ResponseEntity.ok(ResponceBean.success("Stats retrieved successfully", stats));
    }
}
