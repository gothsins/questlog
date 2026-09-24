package com.gothsins.questlog;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@EnableCaching
@SpringBootApplication
public class QuestlogApplication {

	public static void main(String[] args) {
		SpringApplication.run(QuestlogApplication.class, args);
	}
}