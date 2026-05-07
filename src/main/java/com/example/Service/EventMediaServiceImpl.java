package com.example.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.example.Entity.EventMedia;
import com.example.Entity.Events;
import com.example.Exception.ResourceNotFoundException;
import com.example.Repository.EventMediaRepository;
import com.example.Repository.EventsRepository;

@Service
public class EventMediaServiceImpl implements EventMediaService {

    private static final Logger log = LoggerFactory.getLogger(EventMediaServiceImpl.class);

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            "jpg", "jpeg", "png", "gif", "webp", "mp4", "webm", "mov"
    );

    @Autowired
    private EventMediaRepository eventMediaRepository;

    @Autowired
    private EventsRepository eventsRepository;

    @Value("${app.file-upload-dir:uploads}")
    private String uploadDir;

    @Override
    public List<EventMedia> getAllEventMedia() {
        return eventMediaRepository.findAll();
    }

    @Override
    public Optional<EventMedia> getEventMediaById(Integer id) {
        return eventMediaRepository.findById(Objects.requireNonNull(id, "id must not be null"));
    }

    @Override
    public List<EventMedia> getEventMediaByEvent(Events event) {
        return eventMediaRepository.findByEvent(event);
    }

    @Override
    public List<EventMedia> getEventMediaByEventId(Integer eventId) {
        return eventMediaRepository.findByEventId(eventId);
    }

    @Override
    public List<EventMedia> getEventMediaByFileType(EventMedia.MediaType fileType) {
        return eventMediaRepository.findByFileType(fileType);
    }

    @Override
    public List<EventMedia> getEventMediaByEventIdAndFileType(Integer eventId, EventMedia.MediaType fileType) {
        return eventMediaRepository.findByEventIdAndFileType(eventId, fileType);
    }

    @Override
    public List<EventMedia> searchEventMediaByFileName(String fileName) {
        return eventMediaRepository.findByFileNameContaining(fileName);
    }

    @Override
    public List<EventMedia> getEventMediaByMaxSize(Long maxSize) {
        return eventMediaRepository.findByFileSizeLessThanEqual(maxSize);
    }

    @Override
    public EventMedia saveEventMedia(EventMedia eventMedia) {
        return eventMediaRepository.save(Objects.requireNonNull(eventMedia, "event media must not be null"));
    }

    @Override
    public EventMedia uploadMedia(Integer eventId, EventMedia.MediaType mediaType, MultipartFile file, String uploadedBy) {
        Objects.requireNonNull(eventId, "eventId must not be null");
        Objects.requireNonNull(mediaType, "mediaType must not be null");
        Objects.requireNonNull(file, "file must not be null");

        if (file.isEmpty()) {
            throw new IllegalArgumentException("Uploaded file is empty");
        }

        Events event = eventsRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + eventId));

        // Validate file extension
        String originalName = file.getOriginalFilename() == null ? "file" : file.getOriginalFilename();
        String extension = getFileExtension(originalName).toLowerCase();
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new IllegalArgumentException(
                    "File type '" + extension + "' is not allowed. Accepted types: " + ALLOWED_EXTENSIONS);
        }

        try {
            // Store under uploads/events/{eventId}/
            Path basePath = Paths.get(uploadDir, "events", String.valueOf(eventId)).toAbsolutePath().normalize();
            Files.createDirectories(basePath);

            String storedName = UUID.randomUUID() + "_" + originalName;
            Path targetPath = basePath.resolve(storedName);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            EventMedia media = new EventMedia();
            media.setEvent(event);
            media.setFilePath("/uploads/events/" + eventId + "/" + storedName);
            media.setFileName(originalName);
            media.setFileType(mediaType);
            media.setFileSize(file.getSize());
            media.setUploadedBy(uploadedBy);
            return eventMediaRepository.save(media);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to upload media file", e);
        }
    }

    @Override
    public void deleteEventMedia(Integer id) {
        eventMediaRepository.deleteById(Objects.requireNonNull(id, "id must not be null"));
    }

    @Override
    public void deleteMediaWithFile(Integer id) {
        EventMedia media = eventMediaRepository.findById(Objects.requireNonNull(id, "id must not be null"))
                .orElseThrow(() -> new ResourceNotFoundException("Event media not found with id: " + id));

        // Delete the physical file
        try {
            String filePath = media.getFilePath();
            if (filePath != null && filePath.startsWith("/uploads/")) {
                Path physicalPath = Paths.get(uploadDir)
                        .toAbsolutePath()
                        .normalize()
                        .resolve(filePath.substring("/uploads/".length()));
                if (Files.exists(physicalPath)) {
                    Files.delete(physicalPath);
                    log.info("Deleted media file: {}", physicalPath);
                }
            }
        } catch (IOException e) {
            log.warn("Failed to delete physical media file for id {}: {}", id, e.getMessage());
        }

        eventMediaRepository.deleteById(id);
    }

    @Override
    public EventMedia updateEventMedia(Integer id, EventMedia eventMediaDetails) {
        Optional<EventMedia> existingEventMedia = eventMediaRepository.findById(Objects.requireNonNull(id, "id must not be null"));
        if (existingEventMedia.isPresent()) {
            EventMedia eventMedia = existingEventMedia.get();
            eventMedia.setFileName(eventMediaDetails.getFileName());
            eventMedia.setFilePath(eventMediaDetails.getFilePath());
            eventMedia.setFileType(eventMediaDetails.getFileType());
            eventMedia.setFileSize(eventMediaDetails.getFileSize());
            return eventMediaRepository.save(eventMedia);
        }
        throw new ResourceNotFoundException("Event media not found with id: " + id);
    }

    private String getFileExtension(String fileName) {
        int lastDotIndex = fileName.lastIndexOf('.');
        if (lastDotIndex < 0 || lastDotIndex == fileName.length() - 1) {
            return "";
        }
        return fileName.substring(lastDotIndex + 1);
    }
}
