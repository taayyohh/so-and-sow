'use client'

import React, { useState } from 'react'

type TabsProps = {
  children: React.ReactElement<TabProps>[] | React.ReactElement<TabProps>
  defaultTab?: string
}

type TabProps = {
  label: string
  children: React.ReactNode
}

export const Tabs: React.FC<TabsProps> = ({ children, defaultTab = '' }) => {
  const [activeTab, setActiveTab] = useState<string>(defaultTab)

  const headers = React.Children.map(children, (child) => {
    if (!React.isValidElement(child) || child.type !== Tab) return null
    return (
      <button
        key={child.props.label}
        onClick={() => setActiveTab(child.props.label)}
        className={`uppercase px-6 py-2 text-sm ${
          activeTab === child.props.label
            ? 'border border-white/[0.13] bg-[#111]'
            : 'opacity-60 hover:opacity-100'
        }`}
      >
        {child.props.label}
      </button>
    )
  })

  const content = React.Children.toArray(children).find(
    (child) =>
      React.isValidElement(child) && child.type === Tab && child.props.label === activeTab
  )

  return (
    <div>
      <div className="flex space-x-4">{headers}</div>
      <div className="pt-8 min-h-[300px]">{content}</div>
    </div>
  )
}

export const Tab: React.FC<TabProps> = ({ children }) => {
  return <div>{children}</div>
}
