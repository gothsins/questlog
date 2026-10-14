
package com.gothsins.questlog.game.dto;

import java.util.List;

public record GameMediaResponse(
        String summary,
        List<String> genres,
        List<String> screenshots,
        String trailerVideoId
) {
    public static GameMediaResponse empty() {
        return new GameMediaResponse(
                null,
                List.of(),
                List.of(),
                null
        );
    }
}
