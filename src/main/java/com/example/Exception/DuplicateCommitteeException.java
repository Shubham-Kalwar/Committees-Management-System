package com.example.Exception;

public class DuplicateCommitteeException extends RuntimeException {
    public DuplicateCommitteeException(String committeeName) {
        super("Committee with name '" + committeeName + "' already exists.");
    }
}
