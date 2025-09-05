// 실제 이벤트로 실시간 연결 테스트
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ofshqvrldcesvjtredxo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mc2hxdnJsZGNlc3ZqdHJlZHhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNDI1MTQsImV4cCI6MjA2NDYxODUxNH0.uIfuqMP7SFvQfQXSESS9xKHWlBYeWmZwf1j_4eveZ6Q';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testWithRealEvent() {
  console.log('🔥 실제 이벤트로 실시간 테스트 시작...');

  try {
    // 먼저 기존 이벤트 조회
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, event_name, user_id, event_type')
      .limit(1);

    if (eventsError) {
      console.error('❌ 이벤트 조회 실패:', eventsError);
      return;
    }

    if (!events || events.length === 0) {
      console.log('⚠️ 테스트할 이벤트가 없습니다');
      return;
    }

    const testEvent = events[0];
    console.log('📋 테스트 이벤트:', testEvent);

    // 실시간 구독 설정
    const channel = supabase
      .channel('test-realtime-with-event')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'guest_book' 
        }, 
        (payload) => {
          console.log('🎉🎉 guest_book 변경 감지!:', {
            eventType: payload.eventType,
            event: payload.event,
            new: payload.new,
            old: payload.old,
            timestamp: new Date().toISOString()
          });
        }
      )
      .subscribe((status) => {
        console.log('📱 구독 상태:', status);
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ 실시간 구독 성공!');
          
          // 3초 후 테스트 축의금 삽입
          setTimeout(async () => {
            console.log('📝 테스트 축의금 삽입 중...');
            
            const { data, error } = await supabase
              .from('guest_book')
              .insert({
                event_id: testEvent.id,
                guest_name: '실시간테스트_' + Date.now(),
                amount: 100000,
                message: '실시간 알림 테스트 - ' + new Date().toISOString(),
                guest_phone: '010-1234-5678'
              });

            if (error) {
              console.error('❌ 테스트 삽입 실패:', error);
            } else {
              console.log('✅ 테스트 삽입 성공! - 실시간 알림을 기다리는 중...');
            }
          }, 3000);
        }
      });

    // 15초 후 정리
    setTimeout(() => {
      supabase.removeChannel(channel);
      console.log('🧹 테스트 완료 - 채널 정리');
      process.exit(0);
    }, 15000);

  } catch (error) {
    console.error('❌ 테스트 중 오류:', error);
    process.exit(1);
  }
}

testWithRealEvent();