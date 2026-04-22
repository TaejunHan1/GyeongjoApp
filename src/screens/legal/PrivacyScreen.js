// src/screens/legal/PrivacyScreen.js
// 개인정보 처리방침
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../styles/constants';

const EFFECTIVE_DATE = '2026년 4월 22일';
const SERVICE_NAME = '정담';
const CONTACT = '스마트패스 카카오톡 채널 (pf.kakao.com/_WsUuX)';

export default function PrivacyScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>개인정보 처리방침</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        <Text style={styles.docTitle}>{SERVICE_NAME} 개인정보 처리방침</Text>
        <Text style={styles.effective}>시행일: {EFFECTIVE_DATE}</Text>

        <Text style={styles.preamble}>
          {SERVICE_NAME}(이하 "회사")은 이용자의 개인정보를 중요시하며, 『정보통신망 이용촉진 및 정보보호 등에 관한 법률』,
          『개인정보 보호법』을 준수하고 있습니다. 회사는 본 개인정보 처리방침을 통해 이용자가 제공하는 개인정보가 어떠한 용도와
          방식으로 이용되고 있으며, 개인정보 보호를 위해 어떠한 조치가 취해지고 있는지 알려드립니다.
        </Text>

        <Section title="1. 수집하는 개인정보 항목">
          <Body>회사는 회원가입, 서비스 제공, 고객 문의 처리 등을 위해 다음과 같은 최소한의 개인정보를 수집합니다.</Body>

          <SubTitle>필수 항목</SubTitle>
          <Bullet>휴대전화번호 (SMS 인증 및 서비스 식별)</Bullet>
          <Bullet>이름 (청첩장·부고장 표시)</Bullet>
          <Bullet>통신사 정보 (SMS 인증 시)</Bullet>

          <SubTitle>이용자가 직접 입력하는 정보</SubTitle>
          <Bullet>경조사 정보 (예식일, 장소, 주소, 시간, 사진)</Bullet>
          <Bullet>혼주·가족 정보 (이름, 전화번호, 계좌번호) — 청첩장에 표시될 항목에 한함</Bullet>
          <Bullet>방명록 메시지 및 하객 정보 (하객이 직접 입력)</Bullet>

          <SubTitle>자동 수집 항목</SubTitle>
          <Bullet>기기 정보 (OS, 앱 버전, 기기 식별자)</Bullet>
          <Bullet>서비스 이용 기록, 접속 로그, 오류 로그</Bullet>
          <Bullet>결제 내역 (유료 서비스 이용 시, 결제 승인 번호만 보관하며 카드/계좌 정보는 수집하지 않음)</Bullet>
        </Section>

        <Section title="2. 개인정보의 수집 및 이용 목적">
          <Bullet>회원 식별 및 본인 확인, 로그인 유지</Bullet>
          <Bullet>디지털 청첩장·부고장 생성 및 공유</Bullet>
          <Bullet>부조금 기록 및 카카오 알림톡 발송</Bullet>
          <Bullet>방명록·메시지 수집 및 전달</Bullet>
          <Bullet>고객 문의 응대 및 공지사항 전달</Bullet>
          <Bullet>서비스 품질 개선, 부정 이용 방지, 통계 분석</Bullet>
        </Section>

        <Section title="3. 개인정보의 보유 및 이용기간">
          <Body>
            원칙적으로 회원 탈퇴 시 또는 수집·이용 목적 달성 후에는 해당 정보를 지체 없이 파기합니다.
            다만, 관련 법령에 따라 일정 기간 보관해야 하는 정보는 다음과 같이 예외적으로 보관합니다.
          </Body>
          <Bullet>계약 또는 청약철회 등에 관한 기록: 5년 (전자상거래법)</Bullet>
          <Bullet>대금결제 및 재화 등의 공급에 관한 기록: 5년 (전자상거래법)</Bullet>
          <Bullet>소비자 불만 또는 분쟁처리에 관한 기록: 3년 (전자상거래법)</Bullet>
          <Bullet>접속 로그 및 IP 정보: 3개월 (통신비밀보호법)</Bullet>
        </Section>

        <Section title="4. 개인정보의 제3자 제공">
          <Body>
            회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만, 다음의 경우에는 예외로 합니다.
          </Body>
          <Bullet>이용자가 사전에 동의한 경우</Bullet>
          <Bullet>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</Bullet>

          <SubTitle>수탁 업체 (개인정보 처리위탁)</SubTitle>
          <Body>원활한 서비스 제공을 위해 다음과 같이 개인정보 처리업무를 위탁하고 있습니다.</Body>
          <Bullet>Twilio Inc. — SMS 인증 발송</Bullet>
          <Bullet>Supabase Inc. — 데이터베이스 및 인증 서버</Bullet>
          <Bullet>솔라피(Solapi) — 카카오 알림톡 발송 대행</Bullet>
          <Bullet>Apple Inc. / Google LLC — 인앱결제 처리</Bullet>
        </Section>

        <Section title="5. 이용자의 권리와 행사 방법">
          <Body>이용자는 언제든지 다음 권리를 행사할 수 있습니다.</Body>
          <Bullet>개인정보 열람·정정·삭제 요청</Bullet>
          <Bullet>개인정보 처리 정지 요청</Bullet>
          <Bullet>회원 탈퇴 (서비스 내 [프로필] 또는 고객센터)</Bullet>
          <Body>권리 행사는 서비스 내 메뉴 또는 고객센터({CONTACT})를 통해 요청할 수 있으며, 회사는 지체 없이 조치하겠습니다.</Body>
        </Section>

        <Section title="6. 개인정보의 파기 절차 및 방법">
          <Bullet>전자적 파일 형태의 정보: 복구 및 재생이 불가능한 방법으로 영구 삭제합니다.</Bullet>
          <Bullet>종이 문서: 분쇄기로 분쇄하거나 소각하여 파기합니다.</Bullet>
          <Bullet>법령에 따라 보관이 필요한 정보는 별도 DB 또는 별도 저장소에 분리 보관 후 보관 기간 종료 시 파기합니다.</Bullet>
        </Section>

        <Section title="7. 개인정보의 안전성 확보 조치">
          <Bullet>관리적 조치: 내부관리계획 수립·시행, 담당자 교육</Bullet>
          <Bullet>기술적 조치: 개인정보 암호화(AES-256), HTTPS 전송 암호화, 접근 권한 관리, 접속 기록 보관</Bullet>
          <Bullet>물리적 조치: 서버실 및 자료 보관실 접근 통제</Bullet>
        </Section>

        <Section title="8. 쿠키 및 유사 기술">
          <Body>
            모바일 앱에서는 웹 쿠키를 사용하지 않으나, 서비스 품질 향상 및 맞춤형 서비스 제공을 위해
            기기 식별자 및 로컬 저장소(AsyncStorage)를 이용할 수 있으며, 이용자는 기기 설정을 통해 이를 관리할 수 있습니다.
          </Body>
        </Section>

        <Section title="9. 만 14세 미만 아동의 개인정보">
          <Body>
            회사는 만 14세 미만 아동의 회원가입을 허용하지 않으며, 서비스 이용 과정에서 만 14세 미만 아동의 개인정보가
            수집되지 않도록 노력합니다.
          </Body>
        </Section>

        <Section title="10. 개인정보 보호책임자">
          <Body>회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 이용자의 불만 처리 및 피해 구제를 위하여 개인정보 보호책임자를 지정하고 있습니다.</Body>
          <Bullet>연락처: {CONTACT}</Bullet>
        </Section>

        <Section title="11. 권익 침해 구제 방법">
          <Body>개인정보 침해로 인한 신고·상담은 아래 기관에 문의하실 수 있습니다.</Body>
          <Bullet>개인정보 침해신고센터: 국번 없이 118 (privacy.kisa.or.kr)</Bullet>
          <Bullet>개인정보 분쟁조정위원회: 1833-6972 (kopico.go.kr)</Bullet>
          <Bullet>대검찰청 사이버수사과: 국번 없이 1301 (spo.go.kr)</Bullet>
          <Bullet>경찰청 사이버수사국: 국번 없이 182 (ecrm.cyber.go.kr)</Bullet>
        </Section>

        <Section title="12. 개인정보 처리방침의 변경">
          <Body>
            이 개인정보 처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경 내용의 추가, 삭제 및 정정이 있는 경우
            시행 7일 전부터 서비스 내 공지를 통해 고지합니다.
          </Body>
        </Section>

        <Text style={styles.closing}>
          이 방침은 {EFFECTIVE_DATE}부터 적용됩니다.
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ───── 서브 컴포넌트 ─────
const Section = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={{ gap: 4 }}>{children}</View>
  </View>
);

const SubTitle = ({ children }) => (
  <Text style={styles.subTitle}>{children}</Text>
);

const Body = ({ children }) => (
  <Text style={styles.body}>{children}</Text>
);

const Bullet = ({ children }) => (
  <View style={styles.bulletRow}>
    <Text style={styles.bulletDot}>•</Text>
    <Text style={styles.bulletText}>{children}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 8 : 50,
    paddingBottom: 14,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  backBtn: { width: 26 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },

  scrollBody: { paddingHorizontal: 20, paddingVertical: 20 },

  docTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  effective: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  preamble: {
    fontSize: 13,
    color: Colors.gray600,
    lineHeight: 21,
    backgroundColor: Colors.gray50,
    padding: 14,
    borderRadius: 10,
    marginBottom: 24,
  },

  section: { marginBottom: 22 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  subTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: 10,
    marginBottom: 2,
  },
  body: {
    fontSize: 13.5,
    color: Colors.gray700,
    lineHeight: 22,
    marginBottom: 4,
  },

  bulletRow: { flexDirection: 'row', gap: 6 },
  bulletDot: { fontSize: 13.5, color: Colors.gray500, lineHeight: 22, width: 10 },
  bulletText: { flex: 1, fontSize: 13.5, color: Colors.gray700, lineHeight: 22 },

  closing: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
