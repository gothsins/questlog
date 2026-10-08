package com.gothsins.questlog.game;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "games")
@Getter
@Setter
@NoArgsConstructor
public class Game {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(
            name = "igdb_id",
            unique = true
    )
    private Long igdbId;

    @Column(
            nullable = false,
            length = 150
    )
    private String title;

    @Column(name = "release_date")
    private LocalDate releaseDate;

    @Column(
            name = "cover_url",
            length = 255
    )
    private String coverUrl;
}