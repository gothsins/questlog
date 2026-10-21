package com.gothsins.questlog.user;

import com.gothsins.questlog.exception.AvatarValidationException;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.*;

class AvatarImageProcessorTest {
    private final AvatarImageProcessor processor = new AvatarImageProcessor();

    @Test
    void validImageIsReencodedAsSmallJpeg() throws Exception {
        byte[] result = processor.process(png(8, 8));

        assertEquals(0xFF, result[0] & 0xFF);
        assertEquals(0xD8, result[1] & 0xFF);
        BufferedImage decoded = ImageIO.read(new ByteArrayInputStream(result));
        assertEquals(8, decoded.getWidth());
        assertEquals(8, decoded.getHeight());
    }

    @Test
    void contentTypeDoesNotOverrideActualFileFormat() {
        MockMultipartFile svg = new MockMultipartFile("file", "avatar.png", "image/png",
                "<svg xmlns='http://www.w3.org/2000/svg'/>".getBytes(StandardCharsets.UTF_8));
        assertThrows(AvatarValidationException.class, () -> processor.process(svg));
    }

    @Test
    void oversizedAndExcessivelyWideImagesAreRejectedBeforeDecode() throws Exception {
        MockMultipartFile oversized = new MockMultipartFile("file", "avatar.png", "image/png",
                new byte[2 * 1024 * 1024 + 1]);
        assertThrows(AvatarValidationException.class, () -> processor.process(oversized));
        assertThrows(AvatarValidationException.class, () -> processor.process(png(4097, 1)));
    }

    private MockMultipartFile png(int width, int height) throws Exception {
        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        ImageIO.write(image, "png", output);
        return new MockMultipartFile("file", "avatar.png", "image/png", output.toByteArray());
    }
}
