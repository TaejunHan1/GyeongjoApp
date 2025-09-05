// 데이터베이스 스키마 확인
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ofshqvrldcesvjtredxo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mc2hxdnJsZGNlc3ZqdHJlZHhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNDI1MTQsImV4cCI6MjA2NDYxODUxNH0.uIfuqMP7SFvQfQXSESS9xKHWlBYeWmZwf1j_4eveZ6Q';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkSchema() {
  console.log('🔍 데이터베이스 스키마 확인 중...');

  try {
    // events 테이블 모든 컬럼 조회
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .limit(1);

    if (eventsError) {
      console.error('❌ events 테이블 조회 실패:', eventsError);
    } else {
      console.log('📋 events 테이블 샘플:', events[0] ? Object.keys(events[0]) : '데이터 없음');
      if (events[0]) {
        console.log('📋 events 데이터:', events[0]);
      }
    }

    // guest_book 테이블 모든 컬럼 조회
    const { data: guestBook, error: guestBookError } = await supabase
      .from('guest_book')
      .select('*')
      .limit(1);

    if (guestBookError) {
      console.error('❌ guest_book 테이블 조회 실패:', guestBookError);
    } else {
      console.log('📋 guest_book 테이블 샘플:', guestBook[0] ? Object.keys(guestBook[0]) : '데이터 없음');
      if (guestBook[0]) {
        console.log('📋 guest_book 데이터:', guestBook[0]);
      }
    }

  } catch (error) {
    console.error('❌ 스키마 확인 중 오류:', error);
  }
}

checkSchema();