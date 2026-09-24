package com.gothsins.questlog;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
		"security.jwt.secret=MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=",
		"security.jwt.expiration=3600000"
})
class QuestlogApplicationTests {

	@Test
	void contextLoads() {
	}
}