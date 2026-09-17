package com.gothsins.questlog.library;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LibraryEntryRepository extends JpaRepository<LibraryEntry, Long> {

    List<LibraryEntry> findByUser_Id(Long userId);

    Optional<LibraryEntry> findByUser_IdAndGame_Id(
            Long userId,
            Long gameId
    );

    boolean existsByUser_IdAndGame_Id(
            Long userId,
            Long gameId
    );

}