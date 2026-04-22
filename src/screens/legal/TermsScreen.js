// src/screens/legal/TermsScreen.js
// 이용약관
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
const COMPANY_NAME = '정담';
const CONTACT = '스마트패스 카카오톡 채널 (pf.kakao.com/_WsUuX)';

export default function TermsScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>이용약관</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        <Text style={styles.docTitle}>{SERVICE_NAME} 서비스 이용약관</Text>
        <Text style={styles.effective}>시행일: {EFFECTIVE_DATE}</Text>

        <Article n={1} title="목적">
          <Body>
            이 약관은 {COMPANY_NAME}(이하 "회사")이 제공하는 모바일 애플리케이션 "{SERVICE_NAME}"(이하 "서비스")의 이용과 관련하여
            회사와 이용자의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
          </Body>
        </Article>

        <Article n={2} title="용어의 정의">
          <Bullet>“서비스”란 회사가 제공하는 경조사(결혼식·장례식) 정보 등록, 디지털 청첩장·부고장 생성, 부조금 관리, 방명록, 알림톡 발송 등 일체의 기능을 말합니다.</Bullet>
          <Bullet>“이용자”란 이 약관에 따라 서비스를 이용하는 회원 및 비회원을 의미합니다.</Bullet>
          <Bullet>“회원”이란 전화번호 인증을 통해 서비스에 가입한 자를 말합니다.</Bullet>
          <Bullet>“콘텐츠”란 이용자가 서비스에 업로드하는 사진, 메시지, 경조사 정보 등 일체의 자료를 말합니다.</Bullet>
        </Article>

        <Article n={3} title="약관의 효력 및 변경">
          <Bullet>이 약관은 서비스 내 공지하거나 기타의 방법으로 이용자에게 공지함으로써 효력이 발생합니다.</Bullet>
          <Bullet>회사는 관련 법령을 위배하지 않는 범위에서 이 약관을 개정할 수 있으며, 변경 시 시행일 7일 전(이용자에게 불리한 변경은 30일 전)에 공지합니다.</Bullet>
          <Bullet>이용자가 변경된 약관에 동의하지 않는 경우 서비스 이용을 중단하고 탈퇴할 수 있습니다.</Bullet>
        </Article>

        <Article n={4} title="회원가입">
          <Bullet>이용자는 본인의 휴대전화번호로 SMS 인증을 완료한 후 서비스를 이용할 수 있습니다.</Bullet>
          <Bullet>타인의 정보를 도용하거나 허위 정보를 기재한 경우 서비스 이용이 제한될 수 있습니다.</Bullet>
        </Article>

        <Article n={5} title="서비스의 제공 및 변경">
          <Bullet>회사는 이용자에게 다음 각 호의 서비스를 제공합니다: 경조사 등록·관리, 디지털 청첩장/부고장 생성, 템플릿 선택, QR코드·링크 공유, 방명록, 부조금 기록, 알림톡 발송, 하객 연락처 관리 등.</Bullet>
          <Bullet>회사는 서비스의 품질 향상을 위해 제공 내용을 변경할 수 있으며, 변경사항은 사전에 공지합니다.</Bullet>
          <Bullet>회사는 시스템 점검, 통신장애, 천재지변 등 부득이한 사유로 서비스를 일시적으로 중단할 수 있습니다.</Bullet>
        </Article>

        <Article n={6} title="유료 서비스 및 결제">
          <Bullet>회사는 알림톡 발송 크레딧 등 일부 유료 서비스를 제공합니다. 유료 서비스의 가격, 결제 수단, 환불 정책은 서비스 내 별도로 안내합니다.</Bullet>
          <Bullet>결제는 Apple App Store 또는 Google Play의 인앱결제(IAP) 시스템을 따르며, 환불은 해당 스토어의 정책을 우선 적용합니다.</Bullet>
          <Bullet>충전한 크레딧은 이용자의 고의 또는 중대한 과실이 없는 한 서비스 탈퇴 시 소멸됩니다.</Bullet>
        </Article>

        <Article n={7} title="이용자의 의무">
          <Bullet>이용자는 다음 각 호에 해당하는 행위를 해서는 안 됩니다.</Bullet>
          <Bullet indent>타인의 정보를 무단 수집·도용하는 행위</Bullet>
          <Bullet indent>음란물, 폭력적 콘텐츠, 법령에 위배되는 자료를 게시하는 행위</Bullet>
          <Bullet indent>회사 또는 타인의 명예를 훼손하거나 권리를 침해하는 행위</Bullet>
          <Bullet indent>서비스의 정상적인 운영을 방해하는 행위</Bullet>
          <Bullet indent>허위 경조사 정보를 등록하여 부조금을 편취하려는 행위</Bullet>
        </Article>

        <Article n={8} title="콘텐츠의 권리 및 관리">
          <Bullet>이용자가 서비스에 업로드한 콘텐츠의 저작권은 이용자 본인에게 귀속됩니다.</Bullet>
          <Bullet>이용자는 콘텐츠를 서비스 운영·홍보·개선 목적으로 회사가 이용할 수 있도록 비독점적 라이선스를 회사에 허락합니다(탈퇴 후 자동 소멸).</Bullet>
          <Bullet>회사는 불법 콘텐츠 또는 제3자의 권리를 침해하는 콘텐츠를 사전 통지 없이 삭제할 수 있습니다.</Bullet>
        </Article>

        <Article n={9} title="서비스 이용 제한">
          <Bullet>회사는 이용자가 약관을 위반한 경우 이용 경고, 일시 정지, 영구 이용 제한 등의 조치를 할 수 있습니다.</Bullet>
          <Bullet>명백한 법령 위반 또는 타인에게 심각한 피해를 주는 행위에 대해서는 사전 통지 없이 계정을 삭제할 수 있습니다.</Bullet>
        </Article>

        <Article n={10} title="회원 탈퇴">
          <Bullet>회원은 언제든지 서비스 내 [프로필 → 계정 삭제] 또는 고객센터를 통해 탈퇴할 수 있습니다.</Bullet>
          <Bullet>탈퇴 시 등록된 경조사 정보, 방명록, 업로드 이미지 등은 복구 불가능하게 삭제됩니다. 단, 관련 법령에 따라 일정 기간 보관해야 하는 정보는 보관됩니다.</Bullet>
        </Article>

        <Article n={11} title="면책조항">
          <Bullet>회사는 천재지변, 전쟁, 기간통신사업자의 서비스 중지 등 불가항력으로 인한 서비스 장애에 대해 책임지지 않습니다.</Bullet>
          <Bullet>회사는 이용자 간 또는 이용자와 제3자 간에 발생한 거래 또는 분쟁에 개입할 의무가 없으며, 이로 인한 손해에 대해 책임지지 않습니다.</Bullet>
          <Bullet>이용자가 잘못 입력한 정보(계좌번호, 연락처 등)로 인해 발생한 부조금 오입금 등의 손해에 대해 회사는 책임지지 않습니다.</Bullet>
        </Article>

        <Article n={12} title="준거법 및 관할">
          <Bullet>이 약관은 대한민국 법률을 준거법으로 합니다.</Bullet>
          <Bullet>서비스와 관련하여 분쟁이 발생한 경우, 회사의 본점 소재지를 관할하는 법원을 1심 관할법원으로 합니다.</Bullet>
        </Article>

        <Article n={13} title="문의">
          <Body>서비스 이용 관련 문의는 다음 창구로 접수해 주시기 바랍니다.</Body>
          <Body>• 고객센터: {CONTACT}</Body>
        </Article>

        <Text style={styles.closing}>
          이 약관은 {EFFECTIVE_DATE}부터 적용됩니다.
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ───── 서브 컴포넌트 ─────
const Article = ({ n, title, children }) => (
  <View style={styles.article}>
    <Text style={styles.articleTitle}>제{n}조 ({title})</Text>
    <View style={{ gap: 4 }}>{children}</View>
  </View>
);

const Body = ({ children }) => (
  <Text style={styles.articleBody}>{children}</Text>
);

const Bullet = ({ children, indent }) => (
  <View style={[styles.bulletRow, indent && { marginLeft: 14 }]}>
    <Text style={styles.bulletDot}>{indent ? '–' : '•'}</Text>
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
    marginBottom: 24,
  },

  article: { marginBottom: 22 },
  articleTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  articleBody: {
    fontSize: 13.5,
    color: Colors.gray700,
    lineHeight: 22,
  },

  bulletRow: {
    flexDirection: 'row',
    gap: 6,
  },
  bulletDot: {
    fontSize: 13.5,
    color: Colors.gray500,
    lineHeight: 22,
    width: 10,
  },
  bulletText: {
    flex: 1,
    fontSize: 13.5,
    color: Colors.gray700,
    lineHeight: 22,
  },

  closing: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
