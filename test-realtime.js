// 실시간 연결 테스트 스크립트
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ofshqvrldcesvjtredxo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mc2hxdnJsZGNlc3ZqdHJlZHhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNDI1MTQsImV4cCI6MjA2NDYxODUxNH0.uIfuqMP7SFvQfQXSESS9xKHWlBYeWmZwf1j_4eveZ6Q';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testRealtimeConnection() {
  console.log('🔥 실시간 연결 테스트 시작...');

  // 실시간 구독 설정
  const channel = supabase
    .channel('test-realtime-connection')
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'guest_book' 
      }, 
      (payload) => {
        console.log('📱 guest_book 변경 감지:', payload);
      }
    )
    .subscribe((status) => {
      console.log('📱 구독 상태:', status);
    });

  // 5초 후 테스트 데이터 삽입
  setTimeout(async () => {
    console.log('📝 테스트 축의금 삽입 시도...');
    
    const { data, error } = await supabase
      .from('guest_book')
      .insert({
        event_id: 1, // 실제 이벤트 ID로 변경 필요
        guest_name: '실시간테스트',
        amount: 50000,
        message: '실시간 알림 테스트입니다',
        guest_phone: '010-0000-0000'
      });

    if (error) {
      console.error('❌ 테스트 삽입 실패:', error);
    } else {
      console.log('✅ 테스트 삽입 성공:', data);
    }
  }, 5000);

  // 15초 후 정리
  setTimeout(() => {
    supabase.removeChannel(channel);
    console.log('🧹 테스트 채널 정리 완료');
    process.exit(0);
  }, 15000);
}

testRealtimeConnection();