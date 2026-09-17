package com.gothsins.questlog.library;

import com.gothsins.questlog.game.Game;
import com.gothsins.questlog.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "library_entries",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uq_library_entries_user_game",
                        columnNames = {"user_id", "game_id"}
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
public class LibraryEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "game_id", nullable = false)
    private Game game;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private GameStatus status = GameStatus.BACKLOG;

    @Column(
            precision = 3,
            scale = 1
    )
    private BigDecimal rating;

    @Column(
            name = "hours_played",
            nullable = false,
            precision = 8,
            scale = 1
    )
    private BigDecimal hoursPlayed = BigDecimal.ZERO;

    @Column(
            name = "created_at",
            nullable = false,
            insertable = false,
            updatable = false
    )
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(
            name = "updated_at",
            nullable = false
    )
    private LocalDateTime updatedAt;
}