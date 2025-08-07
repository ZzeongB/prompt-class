#!/usr/bin/env python3
"""
클래스/인스턴스 플로우 시각화
인스턴스 -> 클래스 -> 다른 인스턴스 관계와 각 단계에서의 수정사항을 그래프로 표현
"""

import json
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from datetime import datetime
from collections import defaultdict
import numpy as np

class ClassInstanceFlowVisualizer:
    def __init__(self, events_file):
        self.events_file = events_file
        self.events = []
        self.classes = {}  # class_id -> class info
        self.instances = {}  # instance_id -> instance info
        self.flows = []  # instance -> class -> instances 관계
        
    def load_events(self):
        """JSON 이벤트 파일 로드"""
        with open(self.events_file, 'r', encoding='utf-8') as f:
            self.events = json.load(f)
        print(f"총 {len(self.events)}개의 이벤트를 로드했습니다.")
        
    def analyze_flows(self):
        """이벤트를 분석하여 플로우 구성"""
        
        # 1. 클래스와 인스턴스 정보 수집
        for event in self.events:
            event_type = event.get('event', '')
            details = event.get('details', {})
            timestamp = event.get('timestamp', '')
            
            # 클래스 생성
            if event_type == 'class.created':
                class_id = details.get('class_id')
                if class_id:
                    self.classes[class_id] = {
                        'id': class_id,
                        'name': details.get('class_name', 'Unknown'),
                        'created_from': details.get('created_from', 'Unknown'),
                        'source_instance': details.get('instance_id'),  # 생성 소스 인스턴스
                        'placeholder_count': details.get('placeholder_count', 0),
                        'instances': [],  # 이 클래스에서 생성된 인스턴스들
                        'modifications': [],  # 클래스에 대한 수정사항
                        'created_at': timestamp
                    }
            
            # 클래스에서 인스턴스 생성
            elif event_type == 'instance.created_from_class':
                class_id = details.get('class_id')
                instance_id = details.get('instance_id')
                if class_id and instance_id:
                    if class_id in self.classes:
                        self.classes[class_id]['instances'].append(instance_id)
                    
                    self.instances[instance_id] = {
                        'id': instance_id,
                        'label': details.get('instance_label', 'Unknown'),
                        'class_id': class_id,
                        'modifications': [],
                        'created_at': timestamp
                    }
            
            # 인스턴스 수정
            elif event_type in ['instance.updated', 'instance.edit.started']:
                instance_id = details.get('instance_id')
                if instance_id:
                    if instance_id not in self.instances:
                        # 기존 인스턴스 (클래스에서 생성되지 않은)
                        self.instances[instance_id] = {
                            'id': instance_id,
                            'label': details.get('instance_label', 'Unknown'),
                            'class_id': None,
                            'modifications': [],
                            'created_at': timestamp
                        }
                    
                    if event_type == 'instance.updated':
                        self.instances[instance_id]['modifications'].append({
                            'type': 'updated',
                            'timestamp': timestamp,
                            'text_changed': details.get('text_changed', False),
                            'graph_changed': details.get('graph_changed', False)
                        })
            
            # 클래스 수정 (object_node 이벤트)
            elif event_type.startswith('object_node.') and details.get('is_class_mode'):
                # 클래스 모드에서의 오브젝트 편집
                if event_type == 'object_node.edit.saved':
                    # 현재 활성 클래스 찾기 (간단하게 가장 최근 클래스로 가정)
                    for class_id, class_info in self.classes.items():
                        self.classes[class_id]['modifications'].append({
                            'type': 'object_edited',
                            'timestamp': timestamp,
                            'object_id': details.get('object_id'),
                            'object_name': details.get('object_name'),
                            'edit_mode': details.get('edit_mode'),
                            'new_value': details.get('new_value')
                        })
                        break  # 첫 번째 클래스에만 추가 (실제로는 더 정교한 로직 필요)
        
        # 2. 플로우 구성: instance -> class -> instances
        for class_id, class_info in self.classes.items():
            source_instance = class_info.get('source_instance')
            target_instances = class_info.get('instances', [])
            
            if source_instance or target_instances:
                self.flows.append({
                    'source_instance': source_instance,
                    'class': class_id,
                    'target_instances': target_instances,
                    'class_info': class_info
                })
        
        print(f"분석 완료: {len(self.classes)}개 클래스, {len(self.instances)}개 인스턴스, {len(self.flows)}개 플로우")
    
    def create_flow_diagram(self):
        """플로우 다이어그램 생성"""
        fig, ax = plt.subplots(1, 1, figsize=(16, 12))
        
        y_spacing = 3
        x_spacing = 4
        current_y = 0
        
        colors = {
            'instance': '#E3F2FD',  # 연한 파란색
            'class': '#FFF3E0',     # 연한 주황색
            'modification': '#E8F5E8'  # 연한 초록색
        }
        
        # 각 플로우 그리기
        for i, flow in enumerate(self.flows):
            flow_y = current_y - (i * y_spacing * 2)
            
            # Source Instance
            source_id = flow['source_instance']
            if source_id and source_id in self.instances:
                source_info = self.instances[source_id]
                self.draw_instance_box(ax, 0, flow_y, source_info, colors['instance'])
                
                # Source instance modifications
                mod_y = flow_y - 0.5
                for j, mod in enumerate(source_info['modifications']):
                    self.draw_modification_box(ax, 0, mod_y - (j * 0.3), mod, colors['modification'])
            
            # Arrow: Instance -> Class
            if source_id:
                ax.annotate('', xy=(x_spacing - 0.5, flow_y), xytext=(2, flow_y),
                           arrowprops=dict(arrowstyle='->', lw=2, color='blue'))
                ax.text(1, flow_y + 0.2, 'creates', ha='center', fontsize=8, color='blue')
            
            # Class
            class_info = flow['class_info']
            self.draw_class_box(ax, x_spacing, flow_y, class_info, colors['class'])
            
            # Class modifications
            mod_y = flow_y - 0.5
            for j, mod in enumerate(class_info['modifications']):
                self.draw_modification_box(ax, x_spacing, mod_y - (j * 0.3), mod, colors['modification'])
            
            # Target Instances
            target_instances = flow['target_instances']
            if target_instances:
                # Arrow: Class -> Instances
                ax.annotate('', xy=(x_spacing * 2 - 0.5, flow_y), xytext=(x_spacing + 2, flow_y),
                           arrowprops=dict(arrowstyle='->', lw=2, color='green'))
                ax.text(x_spacing + 1, flow_y + 0.2, 'generates', ha='center', fontsize=8, color='green')
                
                # Multiple target instances
                for k, target_id in enumerate(target_instances):
                    if target_id in self.instances:
                        target_info = self.instances[target_id]
                        target_y = flow_y + (k - len(target_instances)/2 + 0.5) * 0.8
                        self.draw_instance_box(ax, x_spacing * 2, target_y, target_info, colors['instance'])
                        
                        # Target instance modifications
                        mod_y = target_y - 0.5
                        for j, mod in enumerate(target_info['modifications']):
                            self.draw_modification_box(ax, x_spacing * 2, mod_y - (j * 0.3), mod, colors['modification'])
        
        # 축 설정
        ax.set_xlim(-3, x_spacing * 2 + 3)
        ax.set_ylim(current_y - len(self.flows) * y_spacing * 2 - 2, 2)
        ax.set_aspect('equal')
        ax.axis('off')
        
        # 제목과 범례
        plt.title('Class-Instance Flow Diagram\nInstance → Class → New Instances', fontsize=16, fontweight='bold', pad=20)
        
        # 범례
        legend_elements = [
            patches.Patch(color=colors['instance'], label='Instance'),
            patches.Patch(color=colors['class'], label='Class'),
            patches.Patch(color=colors['modification'], label='Modification')
        ]
        ax.legend(handles=legend_elements, loc='upper right')
        
        plt.tight_layout()
        return fig
    
    def draw_instance_box(self, ax, x, y, instance_info, color):
        """인스턴스 박스 그리기"""
        width, height = 1.8, 0.8
        
        # 박스
        rect = patches.FancyBboxPatch((x - width/2, y - height/2), width, height,
                                     boxstyle="round,pad=0.1", facecolor=color, 
                                     edgecolor='black', linewidth=1)
        ax.add_patch(rect)
        
        # 텍스트
        label = instance_info['label'][:15] + ('...' if len(instance_info['label']) > 15 else '')
        ax.text(x, y + 0.1, 'Instance', ha='center', va='center', fontsize=8, fontweight='bold')
        ax.text(x, y - 0.1, label, ha='center', va='center', fontsize=7)
        ax.text(x, y - 0.3, f"ID: {instance_info['id'][:8]}...", ha='center', va='center', fontsize=6, color='gray')
    
    def draw_class_box(self, ax, x, y, class_info, color):
        """클래스 박스 그리기"""
        width, height = 1.8, 0.8
        
        # 박스
        rect = patches.FancyBboxPatch((x - width/2, y - height/2), width, height,
                                     boxstyle="round,pad=0.1", facecolor=color, 
                                     edgecolor='black', linewidth=2)
        ax.add_patch(rect)
        
        # 텍스트
        name = class_info['name'][:15] + ('...' if len(class_info['name']) > 15 else '')
        ax.text(x, y + 0.2, 'Class', ha='center', va='center', fontsize=8, fontweight='bold')
        ax.text(x, y, name, ha='center', va='center', fontsize=7)
        ax.text(x, y - 0.2, f"Placeholders: {class_info['placeholder_count']}", ha='center', va='center', fontsize=6, color='gray')
    
    def draw_modification_box(self, ax, x, y, mod_info, color):
        """수정사항 박스 그리기"""
        width, height = 1.6, 0.25
        
        # 박스
        rect = patches.Rectangle((x - width/2, y - height/2), width, height,
                               facecolor=color, edgecolor='gray', linewidth=0.5)
        ax.add_patch(rect)
        
        # 텍스트
        if mod_info['type'] == 'updated':
            text = f"Updated: T={mod_info.get('text_changed', False)}, G={mod_info.get('graph_changed', False)}"
        elif mod_info['type'] == 'object_edited':
            obj_name = mod_info.get('object_name', 'Unknown')[:10]
            new_val = mod_info.get('new_value', '')[:10]
            text = f"Edit {obj_name}: {new_val}"
        else:
            text = f"{mod_info['type']}"
        
        ax.text(x, y, text, ha='center', va='center', fontsize=6, color='darkgreen')
    
    def save_statistics(self, output_file='flow_statistics.txt'):
        """플로우 통계 저장"""
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write("클래스-인스턴스 플로우 통계\n")
            f.write("=" * 40 + "\n\n")
            
            f.write(f"전체 클래스 수: {len(self.classes)}\n")
            f.write(f"전체 인스턴스 수: {len(self.instances)}\n")
            f.write(f"플로우 수: {len(self.flows)}\n\n")
            
            # 각 플로우 상세 정보
            for i, flow in enumerate(self.flows, 1):
                f.write(f"=== 플로우 {i} ===\n")
                
                # Source instance
                source_id = flow['source_instance']
                if source_id and source_id in self.instances:
                    source_info = self.instances[source_id]
                    f.write(f"소스 인스턴스: {source_info['label']} ({source_id})\n")
                    f.write(f"  수정사항: {len(source_info['modifications'])}개\n")
                
                # Class
                class_info = flow['class_info']
                f.write(f"클래스: {class_info['name']} ({class_info['id']})\n")
                f.write(f"  플레이스홀더: {class_info['placeholder_count']}개\n")
                f.write(f"  수정사항: {len(class_info['modifications'])}개\n")
                
                # Target instances
                target_instances = flow['target_instances']
                f.write(f"생성된 인스턴스: {len(target_instances)}개\n")
                for target_id in target_instances:
                    if target_id in self.instances:
                        target_info = self.instances[target_id]
                        f.write(f"  - {target_info['label']} ({target_id}): {len(target_info['modifications'])}개 수정\n")
                
                f.write("\n")
        
        print(f"통계가 {output_file}에 저장되었습니다.")
    
    def run(self):
        """전체 실행"""
        print("클래스-인스턴스 플로우 시각화를 시작합니다...")
        
        self.load_events()
        self.analyze_flows()
        
        if not self.flows:
            print("분석할 플로우가 없습니다.")
            return
        
        # 다이어그램 생성 및 저장
        fig = self.create_flow_diagram()
        fig.savefig('class_instance_flow_diagram.png', dpi=300, bbox_inches='tight')
        print("플로우 다이어그램이 'class_instance_flow_diagram.png'에 저장되었습니다.")
        
        # 통계 저장
        self.save_statistics()
        
        # 다이어그램 표시
        plt.show()

# 사용 예시
if __name__ == "__main__":
    visualizer = ClassInstanceFlowVisualizer('class_instance_events.json')
    visualizer.run()