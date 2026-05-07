package com.example.Service;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.Entity.EventFeedback;
import com.example.Entity.Events;
import com.example.Entity.Users;
import com.example.Exception.ResourceNotFoundException;
import com.example.Repository.EventFeedbackRepository;
import com.example.Repository.EventsRepository;
import com.example.Repository.UsersRepository;

@Service
public class EventFeedbackServiceImpl implements EventFeedbackService {

    @Autowired
    private EventFeedbackRepository eventFeedbackRepository;

    @Autowired
    private EventsRepository eventsRepository;

    @Autowired
    private UsersRepository usersRepository;

    @Override
    public List<EventFeedback> getAllFeedback() {
        return eventFeedbackRepository.findAll();
    }

    @Override
    public Optional<EventFeedback> getFeedbackById(Integer id) {
        return eventFeedbackRepository.findById(Objects.requireNonNull(id, "id must not be null"));
    }

    @Override
    public List<EventFeedback> getFeedbackByEvent(Events event) {
        return eventFeedbackRepository.findByEvent(event);
    }

    @Override
    public List<EventFeedback> getFeedbackByUser(Users user) {
        return eventFeedbackRepository.findByUser(user);
    }

    @Override
    public Optional<EventFeedback> getFeedbackByEventAndUser(Events event, Users user) {
        return eventFeedbackRepository.findByEventAndUser(event, user);
    }

    @Override
    public List<EventFeedback> getFeedbackByEventId(Integer eventId) {
        return eventFeedbackRepository.findByEventIdOrderBySubmittedAt(eventId);
    }

    @Override
    public List<EventFeedback> getFeedbackByRating(Integer rating) {
        return eventFeedbackRepository.findByRating(rating);
    }

    @Override
    public List<EventFeedback> getFeedbackByMinRating(Integer minRating) {
        return eventFeedbackRepository.findByRatingGreaterThanEqual(minRating);
    }

    @Override
    public Double getAverageRatingForEvent(Integer eventId) {
        return eventFeedbackRepository.getAverageRatingByEventId(eventId);
    }

    @Override
    public List<EventFeedback> searchFeedbackByComments(String keyword) {
        return eventFeedbackRepository.findByCommentsContaining(keyword);
    }

    @Override
    public EventFeedback saveFeedback(EventFeedback feedback) {
        return eventFeedbackRepository.save(Objects.requireNonNull(feedback, "feedback must not be null"));
    }

    @Override
    public EventFeedback submitFeedback(Integer eventId, Integer userId, Integer rating, String comment) {
        Objects.requireNonNull(eventId, "eventId must not be null");
        Objects.requireNonNull(userId, "userId must not be null");
        Objects.requireNonNull(rating, "rating must not be null");

        if (rating < 1 || rating > 5) {
            throw new IllegalArgumentException("Rating must be between 1 and 5");
        }

        Events event = eventsRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + eventId));

        Users user = usersRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        if (eventFeedbackRepository.existsByEventAndUser(event, user)) {
            throw new IllegalStateException("You have already submitted feedback for this event");
        }

        EventFeedback feedback = new EventFeedback(event, user, rating, comment);
        return eventFeedbackRepository.save(feedback);
    }

    @Override
    public Map<String, Object> getAnalytics(Integer eventId) {
        Objects.requireNonNull(eventId, "eventId must not be null");

        // Verify event exists
        if (!eventsRepository.existsById(eventId)) {
            throw new ResourceNotFoundException("Event not found with id: " + eventId);
        }

        Double averageRating = eventFeedbackRepository.getAverageRatingByEventId(eventId);
        Long totalResponses = eventFeedbackRepository.countByEventId(eventId);
        List<Object[]> ratingDistribution = eventFeedbackRepository.getRatingDistributionByEventId(eventId);

        // Build distribution map with all ratings 1-5
        Map<Integer, Long> distribution = new LinkedHashMap<>();
        for (int i = 1; i <= 5; i++) {
            distribution.put(i, 0L);
        }
        for (Object[] row : ratingDistribution) {
            Integer ratingKey = (Integer) row[0];
            Long count = (Long) row[1];
            distribution.put(ratingKey, count);
        }

        Map<String, Object> analytics = new HashMap<>();
        analytics.put("averageRating", averageRating != null ? Math.round(averageRating * 100.0) / 100.0 : 0.0);
        analytics.put("totalResponses", totalResponses != null ? totalResponses : 0L);
        analytics.put("ratingDistribution", distribution);

        return analytics;
    }

    @Override
    public void deleteFeedback(Integer id) {
        eventFeedbackRepository.deleteById(Objects.requireNonNull(id, "id must not be null"));
    }

    @Override
    public EventFeedback updateFeedback(Integer id, EventFeedback feedbackDetails) {
        Optional<EventFeedback> existingFeedback = eventFeedbackRepository.findById(Objects.requireNonNull(id, "id must not be null"));
        if (existingFeedback.isPresent()) {
            EventFeedback feedback = existingFeedback.get();
            feedback.setRating(feedbackDetails.getRating());
            feedback.setComments(feedbackDetails.getComments());
            return eventFeedbackRepository.save(feedback);
        }
        throw new ResourceNotFoundException("Event feedback not found with id: " + id);
    }
}
