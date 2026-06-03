"use client";

import { Alert, Form, Input, InputNumber, Modal, Switch } from "antd";
import { useState } from "react";
import { GroupAPI } from "@/lib/api/group";
import { handleApiError, createUserFriendlyErrorMessage } from "@/lib/utils/errors";
import { useAppInteractions } from "@/components/ui/app-interactions";

type CreateGroupValues = {
  name: string;
  description?: string;
  max_members?: number;
  is_public?: boolean;
  join_approval?: boolean;
};

export function CreateGroupModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form] = Form.useForm<CreateGroupValues>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useAppInteractions();

  const handleSubmit = async (values: CreateGroupValues) => {
    try {
      setLoading(true);
      setError(null);

      const res = await GroupAPI.createGroup({
        name: values.name.trim(),
        description: values.description?.trim() || "",
        avatar: "",
        max_members: values.max_members || 500,
        is_public: values.is_public ?? true,
        join_approval: values.join_approval ?? false,
      });

      if (res.data.code === 0) {
        toast("群聊已创建", { tone: "success" });
        onSuccess();
      }
    } catch (error) {
      const apiError = handleApiError(error);
      setError(createUserFriendlyErrorMessage(apiError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      className="ant-app-modal"
      confirmLoading={loading}
      okText="创建群聊"
      open
      title="创建群聊"
      width={560}
      onCancel={onClose}
      onOk={() => form.submit()}
    >
      <Form
        className="ant-app-form"
        form={form}
        initialValues={{
          max_members: 500,
          is_public: true,
          join_approval: false,
        }}
        layout="vertical"
        requiredMark={false}
        onFinish={handleSubmit}
      >
        {error ? <Alert closable message={error} showIcon type="warning" onClose={() => setError(null)} /> : null}

        <Form.Item
          label="群组名称"
          name="name"
          rules={[
            { required: true, message: "请输入群组名称" },
            { max: 100, message: "群组名称最多 100 个字符" },
          ]}
        >
          <Input autoFocus maxLength={100} placeholder="请输入群组名称" size="large" />
        </Form.Item>

        <Form.Item label="群组描述" name="description" rules={[{ max: 500, message: "群组描述最多 500 个字符" }]}>
          <Input.TextArea autoSize={{ minRows: 3, maxRows: 5 }} maxLength={500} placeholder="请输入群组描述" showCount />
        </Form.Item>

        <Form.Item label="最大成员数" name="max_members">
          <InputNumber max={2000} min={2} size="large" style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item className="ant-app-switch-item" name="is_public" valuePropName="checked">
          <Switch />
          <span>
            <strong>公开群聊</strong>
            <small>允许其他用户搜索到该群</small>
          </span>
        </Form.Item>

        <Form.Item className="ant-app-switch-item" name="join_approval" valuePropName="checked">
          <Switch />
          <span>
            <strong>加入审批</strong>
            <small>新成员需要通过审批</small>
          </span>
        </Form.Item>
      </Form>
    </Modal>
  );
}
