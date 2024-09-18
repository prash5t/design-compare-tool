import 'dart:io';
import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:your_app/screens/screen1.dart';
import 'package:your_app/screens/screen2.dart';
// Import other screens as needed
import 'package:dio/dio.dart';

const String FIGMA_TOKEN = 'your_figma_token_here';

Future<String> fetchFigmaImage(String figmaFileUrl) async {
  final dio = Dio();
  final uri = Uri.parse(figmaFileUrl);
  final fileKey = uri.pathSegments.last;
  final nodeId = uri.queryParameters['node-id'];

  try {
    final response = await dio.get(
      'https://api.figma.com/v1/images/$fileKey',
      queryParameters: {'ids': nodeId},
      options: Options(
        headers: {'X-Figma-Token': FIGMA_TOKEN},
      ),
    );

    if (response.statusCode == 200) {
      final data = response.data;
      return data['images'][nodeId];
    } else {
      throw Exception('Failed to load Figma image: ${response.statusCode}');
    }
  } catch (e) {
    throw Exception('Failed to load Figma image: $e');
  }
}

Future<void> downloadFigmaImage(String url, String filename) async {
  final response = await http.get(Uri.parse(url));
  final file = File(filename);
  await file.writeAsBytes(response.bodyBytes);
}

void main() {
  testWidgets('Generate and compare screenshots', (WidgetTester tester) async {
    // List of screens with their Figma URLs and corresponding widgets
    final screens = [
      {
        'name': 'Screen1',
        'figmaUrl': 'https://www.figma.com/file/...?node-id=...',
        'widget': Screen1()
      },
      {
        'name': 'Screen2',
        'figmaUrl': 'https://www.figma.com/file/...?node-id=...',
        'widget': Screen2()
      },
      // Add other screens
    ];

    for (var screen in screens) {
      try {
        // Fetch and download Figma image
        final figmaImageUrl =
            await fetchFigmaImage(screen['figmaUrl'] as String);
        await downloadFigmaImage(figmaImageUrl, '${screen['name']}_figma.png');
        print('Figma image downloaded for ${screen['name']}');

        // Generate app screenshot
        await tester.pumpWidget(MaterialApp(home: screen['widget'] as Widget));
        await tester.pumpAndSettle();
        final appScreenshot = await tester.takeSnapshot();
        final appScreenshotFile = File('${screen['name']}_app.png');
        await appScreenshotFile.writeAsBytes(
            (await appScreenshot.toByteData(format: ImageByteFormat.png))!
                .buffer
                .asUint8List());
        print('App screenshot generated for ${screen['name']}');
      } catch (e) {
        print('Error processing ${screen['name']}: $e');
      }
    }

    // Now, upload the images to the Flask server
    await uploadImagesToServer(screens);
  });
}

Future<void> uploadImagesToServer(List<Map<String, dynamic>> screens) async {
  final url =
      Uri.parse('http://your_flask_server_url/bulk_upload'); // Updated URL
  final request = http.MultipartRequest('POST', url);

  final screensData = screens
      .map((screen) => {
            'name': screen['name'],
            'figma_screenshot': '${screen['name']}_figma.png',
            'app_screenshot': '${screen['name']}_app.png',
          })
      .toList();

  request.fields['screens'] = json.encode(screensData);

  for (var screen in screensData) {
    request.files.add(await http.MultipartFile.fromPath(
      screen['figma_screenshot'],
      screen['figma_screenshot'],
    ));
    request.files.add(await http.MultipartFile.fromPath(
      screen['app_screenshot'],
      screen['app_screenshot'],
    ));
  }

  final response = await request.send();
  if (response.statusCode == 200) {
    print('Images uploaded successfully');
    final responseData = await response.stream.bytesToString();
    print('Server response: $responseData');
  } else {
    print('Failed to upload images');
  }
}
