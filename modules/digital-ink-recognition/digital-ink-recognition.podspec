require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'digital-ink-recognition'
  s.version        = package['version']
  s.summary        = package['description']
  s.license        = { :type => 'MIT' }
  s.homepage       = 'https://github.com/placeholder'
  s.authors        = { 'jeongdam' => 'dev@jeongdam.com' }
  s.platforms      = { :ios => '15.1' }
  s.source         = { :path => '.' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.dependency 'MLKitDigitalInkRecognition'
  s.dependency 'MLKitCommon'

  s.frameworks = 'Vision'
  s.source_files = 'ios/**/*.{h,m,mm,swift}'
end
