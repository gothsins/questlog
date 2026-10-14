package com.gothsins.questlog.exception;

public class NicknameAlreadyExistsException
        extends RuntimeException {

    public NicknameAlreadyExistsException(String message) {
        super(message);
    }
}