package com.gothsins.questlog;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import com.gothsins.questlog.igdb.IgdbProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@EnableCaching
@SpringBootApplication
@EnableConfigurationProperties(IgdbProperties.class)
public class QuestlogApplication {

	public static void main(String[] args) {
		SpringApplication.run(QuestlogApplication.class, args);
	}
}