
package com.gothsins.questlog.user;

import com.gothsins.questlog.exception.AvatarValidationException;

import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

import java.util.Iterator;
import java.util.Locale;

@Component
public class AvatarImageProcessor {

    private static final long MAX_FILE_SIZE = 2 * 1024 * 1024;
    private static final int MAX_DIMENSION = 4096;
    private static final int OUTPUT_DIMENSION = 512;

    public byte[] process(MultipartFile file) {

        if (file == null || file.isEmpty()) {
            throw new AvatarValidationException(
                    "Image file is required"
            );
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new AvatarValidationException(
                    "Image must not exceed 2 MB"
            );
        }

        try (ImageInputStream input =
                     ImageIO.createImageInputStream(
                             file.getInputStream()
                     )) {

            if (input == null) {
                throw invalidImage();
            }

            Iterator<ImageReader> readers =
                    ImageIO.getImageReaders(input);

            if (!readers.hasNext()) {
                throw invalidImage();
            }

            ImageReader reader = readers.next();

            try {
                reader.setInput(input, true, true);

                String format = reader
                        .getFormatName()
                        .toLowerCase(Locale.ROOT);

                if (!format.equals("jpeg")
                        && !format.equals("png")) {
                    throw new AvatarValidationException(
                            "Only JPG and PNG images are supported"
                    );
                }

                int width = reader.getWidth(0);
                int height = reader.getHeight(0);

                if (width <= 0 || height <= 0
                        || width > MAX_DIMENSION
                        || height > MAX_DIMENSION) {
                    throw new AvatarValidationException(
                            "Image dimensions are not allowed"
                    );
                }

                BufferedImage source = reader.read(0);

                if (source == null) {
                    throw invalidImage();
                }

                double scale = Math.min(
                        1.0,
                        (double) OUTPUT_DIMENSION
                                / Math.max(width, height)
                );

                int targetWidth =
                        Math.max(1, (int) Math.round(width * scale));

                int targetHeight =
                        Math.max(1, (int) Math.round(height * scale));

                BufferedImage resized = new BufferedImage(
                        targetWidth,
                        targetHeight,
                        BufferedImage.TYPE_INT_RGB
                );

                Graphics2D graphics = resized.createGraphics();

                try {
                    graphics.setColor(new Color(20, 18, 26));
                    graphics.fillRect(
                            0, 0, targetWidth, targetHeight
                    );

                    graphics.setRenderingHint(
                            RenderingHints.KEY_INTERPOLATION,
                            RenderingHints.VALUE_INTERPOLATION_BICUBIC
                    );

                    graphics.drawImage(
                            source,
                            0, 0,
                            targetWidth, targetHeight,
                            null
                    );
                } finally {
                    graphics.dispose();
                }

                ByteArrayOutputStream output =
                        new ByteArrayOutputStream();

                if (!ImageIO.write(resized, "jpeg", output)) {
                    throw invalidImage();
                }

                return output.toByteArray();

            } finally {
                reader.dispose();
            }

        } catch (IOException ex) {
            throw invalidImage();
        }
    }

    private AvatarValidationException invalidImage() {
        return new AvatarValidationException(
                "Invalid or corrupted image"
        );
    }
}
