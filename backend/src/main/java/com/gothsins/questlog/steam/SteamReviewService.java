
package com.gothsins.questlog.steam;

import com.gothsins.questlog.game.SteamLinkService;
import com.gothsins.questlog.steam.dto.SteamReviewsApiResponse;
import com.gothsins.questlog.steam.dto.SteamReviewsResponse;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import com.gothsins.questlog.steam.dto.SteamWrittenReviewsApiResponse;
import com.gothsins.questlog.steam.dto.SteamWrittenReviewsResponse;

import java.util.List;
import java.util.Objects;


@Service
@RequiredArgsConstructor
@Slf4j
public class SteamReviewService {

    private final SteamLinkService steamLinkService;
    private final SteamClient steamClient;

    @Cacheable(
            value = "steamReviews",
            key = "#p0",
            unless = "#result == null || !#result.available()"
    )
    public SteamReviewsResponse findByGameId(Long gameId) {

        Long steamAppId = steamLinkService
                .findSteamLink(gameId)
                .steamAppId();

        if (steamAppId == null) {
            return SteamReviewsResponse.unavailable(null);
        }

        try {
            SteamReviewsApiResponse apiResponse =
                    steamClient.findReviewSummary(steamAppId);

            if (apiResponse == null
                    || apiResponse.response() == null) {
                return SteamReviewsResponse.unavailable(
                        steamAppId
                );
            }

            SteamReviewsApiResponse.QuerySummary summary =
                    apiResponse.response().querySummary();

            if (summary == null
                    || summary.totalPositive() == null
                    || summary.totalNegative() == null
                    || summary.totalReviews() == null) {
                return SteamReviewsResponse.unavailable(
                        steamAppId
                );
            }

            long positive = summary.totalPositive();
            long negative = summary.totalNegative();
            long total = summary.totalReviews();

            if (positive < 0 || negative < 0 || total < 0) {
                return SteamReviewsResponse.unavailable(
                        steamAppId
                );
            }

            double countedReviews =
                    (double) positive + negative;

            Double positivePercentage = countedReviews > 0
                    ? Math.round(
                    1000.0 * positive / countedReviews
            ) / 10.0
                    : null;

            return new SteamReviewsResponse(
                    steamAppId,
                    true,
                    summary.reviewScoreDesc(),
                    positive,
                    negative,
                    total,
                    positivePercentage
            );

        } catch (RestClientException | IllegalStateException ex) {

            log.warn(
                    "Steam reviews unavailable for app {}: {}",
                    steamAppId,
                    ex.getClass().getSimpleName()
            );

            return SteamReviewsResponse.unavailable(
                    steamAppId
            );
        }
    }


    @Cacheable(
            value = "steamReviewTexts",
            key = "#p0",
            unless = "#result == null || !#result.available()"
    )
    public SteamWrittenReviewsResponse findWrittenReviewsByGameId(
            Long gameId
    ) {

        Long steamAppId = steamLinkService
                .findSteamLink(gameId)
                .steamAppId();

        if (steamAppId == null) {
            return SteamWrittenReviewsResponse.unavailable(null);
        }

        try {
            SteamWrittenReviewsApiResponse apiResponse =
                    steamClient.findWrittenReviews(steamAppId);

            if (apiResponse == null
                    || apiResponse.response() == null
                    || apiResponse.response().reviews() == null) {

                return SteamWrittenReviewsResponse.unavailable(
                        steamAppId
                );
            }

            List<SteamWrittenReviewsResponse.Review> reviews =
                    apiResponse.response()
                            .reviews()
                            .stream()
                            .filter(Objects::nonNull)
                            .filter(review ->
                                    review.review() != null
                                            && !review.review().isBlank()
                            )
                            .limit(5)
                            .map(review ->
                                    new SteamWrittenReviewsResponse.Review(
                                            review.recommendationId(),
                                            review.review().strip(),
                                            Boolean.TRUE.equals(
                                                    review.votedUp()
                                            ),
                                            review.timestampCreated(),
                                            review.language(),
                                            review.author() == null
                                                    ? null
                                                    : review.author()
                                                    .playtimeAtReview()
                                    )
                            )
                            .toList();

            return new SteamWrittenReviewsResponse(
                    steamAppId,
                    true,
                    reviews,
                    apiResponse.response().cursor()
            );

        } catch (RestClientException | IllegalStateException ex) {

            log.warn(
                    "Steam written reviews unavailable for app {}: {}",
                    steamAppId,
                    ex.getClass().getSimpleName()
            );

            return SteamWrittenReviewsResponse.unavailable(
                    steamAppId
            );
        }
    }

}
